const { ethers, BigNumber } = require("ethers")
const { Token, Fetcher, Route, Trade, TokenAmount, TradeType, Percent } = require("@uniswap/sdk");
const UNISWAP_ROUTER_ABI = require('./v2RouterAbi.json')
const erc20Abi = require('./abi.json')

const buy = async (token, amount, user, walletSecret) => {

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
        const buyToken = new Token(
            1,
            token.address,
            token.decimals, // update (18)
            token.symbol, // update (UNI)
            token.name // update (Uniswap)
        );

        // Providers & Wallets
        let RPC_URL;
        if (user.mevProtectionOn) { // set mev protection rpc url
            RPC_URL = "https://rpc.mevblocker.io/"
        } else {
            RPC_URL = "https://mainnet.infura.io/v3/d25074e260984463be075e88db795106"
        }
        const ethersProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const ethersSigner = new ethers.Wallet(walletSecret, ethersProvider);

        // Router Info
        const UNISWAP_ROUTER_ADDRESS = "0x81d69a8dc9364cfb8273b1b55f9d4715ec782fd9"
        const UNISWAP_ROUTER_CONTRACT = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, ethersProvider)

        const pair = await Fetcher.fetchPairData(buyToken, WETH, ethersProvider); //creating instances of a pair
        const route = await new Route([pair], WETH); // a fully specified path from input token to output token
        let amountIn = ethers.utils.parseEther(amount.toString()); //helper function to convert ETH to Wei
        amountIn = amountIn.toString()

        const slippageTolerance = new Percent(user.defaultSlippage, "100"); // 50 bips, or 0.50% - Slippage tolerance

        const trade = new Trade( //information necessary to create a swap transaction.
            route,
            new TokenAmount(WETH, amountIn),
            TradeType.EXACT_INPUT
        );

        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
        const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();
        const path = [WETH.address, buyToken.address]; //An array of token addresses
        const to = ethersSigner.address; // should be a checksummed recipient address
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
        const value = trade.inputAmount.raw; // // needs to be converted to e.g. hex
        const valueHex = await ethers.BigNumber.from(value.toString()).toHexString(); //convert to hex string

        // Return if maxGas fails
        if (user.maxGas) {
            const gasPrice = await ethersProvider.getGasPrice();
            if (parseFloat(user.maxGas) < parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei'))) {
                return { resp: "error", reason: "Current gas prices are greater than your max" }
            }
        }

        //Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
        const rawTxn = await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(amountOutMinHex, path, to, deadline, {
            value: valueHex,
            gasLimit: BigNumber.from(user.gasLimit)
        })

        // Returns a Promise which resolves to the transaction.
        let sendTxn = await ethersSigner.sendTransaction(rawTxn)
        return {
            resp: "success",
            hash: sendTxn.hash,
            spent: amount,
            recieved: 0,
            promise: sendTxn.wait()
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

module.exports = { buy }