const { ethers, BigNumber } = require('ethers');
const {
    PERMIT2_ADDRESS,
    SignatureTransfer,
    AllowanceTransfer,
    AllowanceProvider
} = require('@uniswap/permit2-sdk');
const { AlphaRouter, SwapType, SWAP_ROUTER_02_ADDRESSES } = require('@uniswap/smart-order-router');
const { CurrencyAmount, TradeType, Percent, Token, ChainId } = require('@uniswap/sdk-core');
const { UNIVERSAL_ROUTER_ADDRESS } = require('@uniswap/universal-router-sdk')
const erc20Abi = require('./abi.json')
const wethAbi = require('./abi.json')

const sell = async (token, userWallet, slipPercent, sellAmount, maxFeePerGas, maxPriorityFeePerGas, gasLimit, sellDelta, walletSecret) => {

    try {

        const chainId = 1

        const uniswapRouterAddress = UNIVERSAL_ROUTER_ADDRESS(chainId)

        // SELL TO WETH
        const WETH = new Token(
            chainId,
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            18,
            'WETH',
            'Wrapped Ether'
        );

        // REPLACE WITH SELL TOKEN //
        const sellToken = new Token(
            chainId,
            token.address,
            token.decimals, // update (18)
            token.symbol, // update (UNI)
            token.name // update (Uniswap)
        );

        const ethersProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);
        const ethersSigner = new ethers.Wallet(walletSecret, ethersProvider);

        async function approvePermit2Contract(erc20Address, amount) {
            const erc20 = new ethers.Contract(erc20Address, erc20Abi, ethersSigner);
            const approveTx = await erc20.approve(PERMIT2_ADDRESS, amount);
            // console.log('approve tx hash:', approveTx.hash); //
            // wait for approve transaction confirmation
            const status = await approveTx.wait();
            // console.log('approve tx status', status);
        }

        async function getAllowanceAmount(erc20TokenAddress, spender) {
            const erc20 = new ethers.Contract(erc20TokenAddress, erc20Abi, ethersSigner);
            const allowance = await erc20.allowance(userWallet, spender);
            // console.log('allowance:', allowance.toString());
        }

        async function getSwapRoute(sourceToken, destToken, amount, permit, signature) {
            const wei = ethers.utils.parseUnits(amount.toString(), sourceToken.decimals);
            const inputAmount = CurrencyAmount.fromRawAmount(sourceToken, wei.toString());

            const router = new AlphaRouter({ chainId, provider: ethersProvider });
            const route = await router.route(
                inputAmount,
                destToken,
                TradeType.EXACT_INPUT,
                {
                    recipient: userWallet,
                    slippageTolerance: new Percent(parseInt(slipPercent), 100),
                    // type: SwapType.SWAP_ROUTER_02,
                    // deadline: Math.floor(Date.now() / 1000 + 1800),

                    type: SwapType.UNIVERSAL_ROUTER,
                    deadlineOrPreviousBlockhash: Math.floor(Date.now() / 1000 + 1800),

                    inputTokenPermit: {
                        ...permit,
                        signature

                        // for ROUTER V2
                        // r: signature.r,
                        // s: signature.s,
                        // v: signature.v,
                        // for allowance transfer with Router V2
                        // expiry: permit.sigDeadline,
                        // nonce: permit.details.nonce
                        // for signature transfer with Router V2
                        // deadline: permit.deadline,
                        // amount: permit.permitted.amount
                    }
                }
            );
            // console.log(`Quote Exact In: ${route.quote.toFixed(10)}`);
            return route;
        }

        async function executeSwap() {
            // swap basic info
            // NOTE: not handling native currency swaps here
            const sourceToken = sellToken;
            const destToken = WETH;

            // Determine percent of total to sell
            const tokenContract = await new ethers.Contract(token.address, erc20Abi, ethersProvider)
            const tokensHeld = ethers.utils.formatUnits(await tokenContract.balanceOf(userWallet), token.decimals)
            const amount = tokensHeld * sellAmount

            console.log("amount", amount)

            // Convert percentage sale to WEI
            const amountInWei = ethers.utils.parseUnits(
                amount.toString(),
                sourceToken.decimals
            );

            // expiry for permit & tx confirmation, 30 mins
            const expiry = Math.floor(Date.now() / 1000 + 1800);

            // check if we have approved enough amount
            // for PERMIT2 in source token contract
            const allowance = await getAllowanceAmount(
                sourceToken.address,
                PERMIT2_ADDRESS
            );
            if (allowance === 0 || allowance < amount) {
                // approve permit2 contract for source token
                // NOTE: amount is set to max here
                // NOTE: this will send out approve tx
                // and wait for confirmation
                await approvePermit2Contract(
                    sourceToken.address,
                    ethers.constants.MaxInt256 // APPROVE MAX AMOUNT
                );
            }

            // allowance provider is part of permit2 sdk
            // using it to get nonce value of last permit
            // we signed for this source token
            const allowanceProvider = new AllowanceProvider(
                ethersProvider,
                PERMIT2_ADDRESS
            );

            // for allowance based transfer we can just use
            // next nonce value for permits.
            // for signature transfer probably it has to be
            // a prime number or something. checks uniswap docs.
            // const nonce = 1;
            const nonce = await allowanceProvider.getNonce(
                sourceToken.address,
                userWallet,
                uniswapRouterAddress
            );
            // console.log('nonce value:', nonce);

            // create permit with AllowanceTransfer
            const permit = {
                details: {
                    token: sourceToken.address,
                    amount: amountInWei,
                    expiration: expiry,
                    nonce
                },
                spender: uniswapRouterAddress,
                sigDeadline: expiry
            };
            const { domain, types, values } = AllowanceTransfer.getPermitData(
                permit,
                PERMIT2_ADDRESS,
                chainId
            );

            // create signature for permit
            const signature = await ethersSigner._signTypedData(domain, types, values);
            // console.log('signature: ', signature);
            // for V2 router we need to provide v, r, & s from signature.
            // we can split the signature using provider utils
            // const splitSignature = ethers.utils.splitSignature(signature);
            // console.log('split signature:', splitSignature);

            // NOTE: optionally verify the signature
            const address = await ethers.utils.verifyTypedData(
                domain,
                types,
                values,
                signature
            );

            if (address !== userWallet)
                throw new error('signature verification failed');

            // get swap route for tokens
            const route = await getSwapRoute(
                sourceToken,
                destToken,
                amount,
                permit,
                signature
            );

            // console.log('route calldata:', route.methodParameters.calldata);

            // create transaction arguments for swap
            const txArguments = {
                data: route.methodParameters.calldata,
                to: uniswapRouterAddress,
                value: BigNumber.from(route.methodParameters.value),
                from: userWallet,
                gasPrice: route.gasPriceWei,
                gasLimit: BigNumber.from('1000000')            
                // gasLimit: ethers.utils.hexlify(parseInt(gasLimit)), // in WEI
                // maxFeePerGas: parseInt(maxFeePerGas) * 1e9, // gwei to wei
                // maxPriorityFeePerGas: parseInt(maxPriorityFeePerGas) * 1e9 // gwei to wei
            };

            // send out swap transaction
            const transaction = await ethersSigner.sendTransaction(txArguments);
            await transaction.wait()

            // Convert WETH to ETH
            const wethContract = await new ethers.Contract(WETH.address, erc20Abi, ethersProvider)
            const currentWeth = ethers.utils.formatUnits(await wethContract.balanceOf(walletAddress), 18)

            if (currentWeth > 0) {

                // WETH Contract Instance
                const WETH_Contract = new ethers.Contract(WETH.address, wethAbi, ethersSigner);

                // Unwrap WETH to ETH
                const wethToSell = ethers.utils.parseEther(currentWeth)
                const unwrapTx = await WETH_Contract.withdraw(wethToSell.toString());
                await unwrapTx.wait();

                console.log('ETH Balance:', ethers.utils.formatUnits(await ethersProvider.getBalance(walletAddress), 18))
            } else {
                console.log('No WETH Found')
            }

            return transaction.hash

        }

        const hash = await executeSwap();
        return hash

    } catch (e) {
        console.log(e)
        return "error"
    }

}

module.exports = { sell }