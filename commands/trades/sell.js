const { ethers, BigNumber } = require("ethers")
const { Token, Fetcher, Route, Trade, TokenAmount, TradeType, Percent } = require("@uniswap/sdk");
const UNISWAP_ROUTER_ABI = require('./v2RouterAbi.json')
const erc20Abi = require('./abi.json')

const sell = async (token, sellAmount, user, walletSecret) => {

    try {

        // FROM ETH
        const WETH = new Token(
            1,
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            18,
            'WETH',
            'Wrapped Ether'
        );

        // TO TOKEN
        const sellToken = new Token(
            1,
            token.address,
            token.decimals, // update (18)
            token.symbol, // update (UNI)
            token.name // update (Uniswap)
        );

        // ROUTER INFO
        const ethersProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);
        const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
        const UNISWAP_ROUTER_CONTRACT = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, ethersProvider)
        const ethersSigner = new ethers.Wallet(walletSecret, ethersProvider);

        // Determine percent of total to sell
        const percentContract = await new ethers.Contract(sellToken.address, erc20Abi, ethersProvider)
        const tokensHeld = ethers.utils.formatUnits(await percentContract.balanceOf(ethersSigner.address), sellToken.decimals)
        const amount = tokensHeld * sellAmount

        const pair = await Fetcher.fetchPairData(WETH, sellToken, ethersProvider); //creating instances of a pair
        const route = await new Route([pair], sellToken); // a fully specified path from input token to output token
        let amountIn = ethers.utils.parseUnits(amount.toString(), token.decimals); //helper function to convert ETH to Wei
        amountIn = amountIn.toString()

        const slippageTolerance = new Percent(user.defaultSlippage, "100"); // 50 bips, or 0.50% - Slippage tolerance

        const trade = new Trade( //information necessary to create a swap transaction.
            route,
            new TokenAmount(sellToken, amountIn),
            TradeType.EXACT_INPUT
        );

        // Calculate estimated output ETH
        const amountOutEthRaw = trade.minimumAmountOut(new Percent("0", "100")).raw
        const amountOutEth = Number(ethers.utils.formatUnits(amountOutEthRaw.toString(), 18)).toFixed(5)

        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
        const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();
        const path = [sellToken.address, WETH.address]; //An array of token addresses
        const to = ethersSigner.address; // should be a checksummed recipient address
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
        const value = trade.inputAmount.raw; // // needs to be converted to e.g. hex
        const valueHex = await ethers.BigNumber.from(value.toString()).toHexString(); //convert to hex string

        // Pull approved amount on router
        const tokenContract = new ethers.Contract(sellToken.address, erc20Abi, ethersSigner);
        const allowance = await tokenContract.allowance(ethersSigner.address, UNISWAP_ROUTER_ADDRESS);

        // Approve max amount if approval too low
        if (allowance._hex <= 0 || allowance._hex < valueHex) {
            console.log('Approving Token')
            let approvalTransaction = await tokenContract.approve(UNISWAP_ROUTER_ADDRESS, ethers.constants.MaxUint256);
            await approvalTransaction.wait();
        }

        // Return if maxGas fails
        if (user.maxGas) {
            const gasPrice = await ethersProvider.getGasPrice();
            if (parseFloat(user.maxGas) < parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei'))) {
                return { resp: "error", reason: "Current gas prices are greater than your max" }
            }
        }

        //Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
        const rawTxn = await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(
            valueHex, amountOutMinHex, path, to, deadline, {
            gasLimit: BigNumber.from(user.gasLimit)
        })

        // Returns a Promise which resolves to the transaction.
        let sendTxn = await ethersSigner.sendTransaction(rawTxn)
        return {
            resp: "success",
            hash: sendTxn.hash,
            spent: amount,
            recieved: amountOutEth,
            promise: sendTxn
        }

    } catch (e) {
        if (e.reason) {
            return { resp: "error", reason: e.reason }
        } else {
            console.log(e)
            return { resp: "error", reason: "Error placing transaction" }
        }
    }
}

module.exports = { sell }