const { ethers, BigNumber } = require('ethers');
const {
    PERMIT2_ADDRESS,
    SignatureTransfer,
    AllowanceTransfer,
    AllowanceProvider
} = require('@uniswap/permit2-sdk');
const { AlphaRouter, SwapType, SWAP_ROUTER_02_ADDRESSES, nativeOnChain } = require('@uniswap/smart-order-router');
const { CurrencyAmount, TradeType, Percent, Token, ChainId } = require('@uniswap/sdk-core');
const { UNIVERSAL_ROUTER_ADDRESS } = require('@uniswap/universal-router-sdk')
const erc20Abi = require('./abi.json')
const wethAbi = require('./wethAbi.json')

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

        // pull amount of token user is currently holding
        const startEth = ethers.utils.formatUnits(await ethersProvider.getBalance(userWallet), 18)

        async function approvePermit2Contract(erc20Address, amount) {
            const erc20 = new ethers.Contract(erc20Address, erc20Abi, ethersSigner);
            const approveTx = await erc20.approve(PERMIT2_ADDRESS, amount);
            console.log('approve tx hash:', approveTx.hash);
            await approveTx.wait();
        }

        async function getAllowanceAmount(erc20TokenAddress, spender) {
            const erc20 = new ethers.Contract(erc20TokenAddress, erc20Abi, ethersSigner);
            const allowance = await erc20.allowance(userWallet, spender);
            return allowance
        }

        async function getSwapRoute(sourceToken, destToken, amount, permit, signature) {
            const wei = ethers.utils.parseUnits(amount.toString(), sourceToken.decimals);
            const inputAmount = CurrencyAmount.fromRawAmount(sourceToken, wei.toString());

            const router = new AlphaRouter({ chainId, provider: ethersProvider });
            const route = await router.route(
                inputAmount,
                // destToken,
                nativeOnChain(1), // Destination -> ETH
                TradeType.EXACT_INPUT,
                {
                    recipient: userWallet,
                    slippageTolerance: new Percent(parseInt(slipPercent), 100),
                    type: SwapType.UNIVERSAL_ROUTER,
                    deadlineOrPreviousBlockhash: Math.floor(Date.now() / 1000 + 1800),
                    inputTokenPermit: {
                        ...permit,
                        signature
                    }
                }
            );
            console.log(`Quote Exact In: ${route.quote.toFixed(10)}`);
            return route;
        }

        async function executeSwap() {
            const sourceToken = sellToken;
            const destToken = WETH;

            // Determine percent of total to sell
            const tokenContract = await new ethers.Contract(token.address, erc20Abi, ethersProvider)
            const tokensHeld = ethers.utils.formatUnits(await tokenContract.balanceOf(userWallet), token.decimals)
            const amount = tokensHeld * sellAmount

            // Convert percentage sale to WEI
            const amountInWei = ethers.utils.parseUnits(
                amount.toString(),
                sourceToken.decimals
            );

            // expiry for permit & tx confirmation, 30 mins
            const expiry = Math.floor(Date.now() / 1000 + 1800);

            // check token spending allowance
            const allowance = await getAllowanceAmount(
                sourceToken.address,
                PERMIT2_ADDRESS
            );

            console.log('allowance:', ethers.utils.formatEther(allowance));  

            // if allowance too low, up it
            if (ethers.utils.formatEther(allowance) == 0 || ethers.utils.formatEther(allowance) < amountInWei) {
                console.log('Approving Token For Sale')
                await approvePermit2Contract(
                    sourceToken.address,
                    ethers.constants.MaxUint256 // APPROVE MAX AMOUNT
                );
            }

            const allowanceProvider = new AllowanceProvider(
                ethersProvider,
                PERMIT2_ADDRESS
            );

            const nonce = await allowanceProvider.getNonce(
                sourceToken.address,
                userWallet,
                uniswapRouterAddress
            );

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

            // create transaction arguments for swap
            const txArguments = {
                data: route.methodParameters.calldata,
                to: uniswapRouterAddress,
                value: BigNumber.from(route.methodParameters.value),
                from: userWallet,
                gasPrice: route.gasPriceWei,
                gasLimit: BigNumber.from('400000')
                // gasLimit: ethers.utils.hexlify(parseInt(gasLimit)), // in WEI
                // maxFeePerGas: parseInt(maxFeePerGas) * 1e9, // gwei to wei
                // maxPriorityFeePerGas: parseInt(maxPriorityFeePerGas) * 1e9 // gwei to wei
            };

            // send out swap transaction
            const transaction = await ethersSigner.sendTransaction(txArguments);
            await transaction.wait()

            // Current WETH (Calculate ETH Sold)
            const currentEth = ethers.utils.formatUnits(await ethersProvider.getBalance(userWallet), 18)

            return {
                hash: transaction.hash,
                spent: amount,
                recieved: currentEth - startEth
            }

        }

        const hash = await executeSwap();
        return hash

    } catch (e) {
        console.log(e)
        return "error"
    }

}

module.exports = { sell }