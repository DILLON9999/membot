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
const wethAbi = require('./wethAbi.json')

const buy = async (token, amount, user, walletSecret) => {

    try {

        const chainId = 1

        const uniswapRouterAddress = UNIVERSAL_ROUTER_ADDRESS(chainId)

        // SELL FROM WETH
        const WETH = new Token(
            chainId,
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            18,
            'WETH',
            'Wrapped Ether'
        );

        // REPLACE WITH SELL TOKEN //
        const buyToken = new Token(
            chainId,
            token.address,
            token.decimals, // update (18)
            token.symbol, // update (UNI)
            token.name // update (Uniswap)
        );

        const ethersProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);
        const ethersSigner = new ethers.Wallet(walletSecret, ethersProvider);

        // Wrap ETH into WETH
        const WETH_Contract = new ethers.Contract(WETH.address, wethAbi, ethersSigner);
        const overrides = {
            value: ethers.utils.parseEther(amount.toString())     // ether to send
        };
        const unwrapTx = await WETH_Contract.deposit(overrides);
        await unwrapTx.wait();

        // pull amount of token user is currently holding
        const tokenContract = await new ethers.Contract(token.address, erc20Abi, ethersProvider)
        const startTokenAmount = ethers.utils.formatUnits(await tokenContract.balanceOf(user.walletAddress), token.decimals)

        async function approvePermit2Contract(erc20Address, amount) {
            const erc20 = new ethers.Contract(erc20Address, erc20Abi, ethersSigner);
            const approveTx = await erc20.approve(PERMIT2_ADDRESS, amount);
            await approveTx.wait();
        }

        async function getAllowanceAmount(erc20TokenAddress, spender) {
            const erc20 = new ethers.Contract(erc20TokenAddress, erc20Abi, ethersSigner);
            const allowance = await erc20.allowance(user.walletAddress, spender);
            return allowance
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
                    recipient: user.walletAddress,
                    slippageTolerance: new Percent(parseInt(user.defaultSlippage), 100),
                    type: SwapType.UNIVERSAL_ROUTER,
                    deadlineOrPreviousBlockhash: Math.floor(Date.now() / 1000 + 1800),
                    inputTokenPermit: {
                        ...permit,
                        signature
                    }
                }
            );
            // console.log(`Quote Exact In: ${route.quote.toFixed(10)}`);
            return route;
        }

        async function executeSwap() {
            const sourceToken = WETH;
            const destToken = buyToken;

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

            // if allowance too low, up it
            if (BigInt(allowance._hex) == 0 || BigInt(allowance._hex) < BigInt(amountInWei._hex)) {
                console.log('Allowance Limited, Increasing...')
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
                user.walletAddress,
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

            if (address !== user.walletAddress)
                throw new error('signature verification failed');

            // get swap route for tokens
            const route = await getSwapRoute(
                sourceToken,
                destToken,
                amount,
                permit,
                signature
            );

            // Return if gas is greater than set limit
            if (user.maxGas) {
                if ((BigInt(user.maxGas) * BigInt(1000000000)) < BigInt(route.gasPriceWei)) {
                    return { resp: "error", reason: "Transaction gas beyond your set limit" }
                }
            }

            const txArguments = {
                data: route.methodParameters.calldata,
                to: uniswapRouterAddress,
                value: BigNumber.from(route.methodParameters.value),
                from: user.walletAddress,
                gasPrice: route.gasPriceWei,
                gasLimit: BigNumber.from(user.gasLimit)
            };

            // send out swap transaction
            const transaction = await ethersSigner.sendTransaction(txArguments);
            await transaction.wait()
            console.log('TX Hash:', transaction.hash)
            const endTokenAmount = ethers.utils.formatUnits(await tokenContract.balanceOf(user.walletAddress), token.decimals)

            // Max approve new purchased token for later
            await approvePermit2Contract(token.address, ethers.constants.MaxUint256) // APPROVE MAX AMOUNT

            return {
                resp: "success",
                hash: transaction.hash,
                spent: amount,
                recieved: endTokenAmount - startTokenAmount
            }

        }

        const hash = await executeSwap();
        return hash

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