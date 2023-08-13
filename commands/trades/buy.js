const { ethers, BigNumber } = require('ethers')
const JSBI = require('jsbi')
const { SupportedChainId, Token, Percent, CurrencyAmount, TradeType } = require('@uniswap/sdk-core')
const { AlphaRouter, ChainId, SwapOptionsSwapRouter02, SwapRoute, SwapType } = require('@uniswap/smart-order-router')
const ERC20ABI = require('./abi.json')
const { abi: V3SwapRouterABI } = require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json')

// CONSTS
const ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const INFURA_URL = 'https://mainnet.infura.io/v3/d25074e260984463be075e88db795106'


const buy = async (contract, userWallet, slipPercent, ethAmount, maxFeePerGas, maxPriorityFeePerGas, gasLimit, buyDelta, walletSecret, decimals) => {

    try {

        // create provider and signing wallet
        const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)
        const signer = new ethers.Wallet(walletSecret, provider)

        // create router contract
        const router = new ethers.Contract(
            ROUTER_ADDRESS,
            V3SwapRouterABI
        )

        // parse eth input to wei
        const inputAmount = ethers.utils.parseEther(ethAmount)

        // pull amount of token user is currently holding
        const tokenContract = await new ethers.Contract(contract, ERC20ABI, provider)
        const startTokenAmount = ethers.utils.formatUnits(await tokenContract.balanceOf(userWallet), decimals)      

        // routing parameters
        const params = {
            tokenIn: WETH_ADDRESS,
            tokenOut: contract,
            fee: 3000,
            recipient: userWallet,
            deadline: Math.floor(Date.now() / 1000 + 1800),
            slippageTolerance: new Percent(10, 100),
            amountIn: inputAmount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        }

        const data = router.interface.encodeFunctionData("exactInputSingle", [params])

        const txArgs = {
            to: ROUTER_ADDRESS,
            from: userWallet,
            data: data,
            value: inputAmount,
            gasLimit: ethers.utils.hexlify(400000)

            // gasLimit: ethers.utils.hexlify(parseInt(gasLimit)), // in WEI
            // maxFeePerGas: parseInt(maxFeePerGas) * 1e9, // gwei to wei
            // maxPriorityFeePerGas: parseInt(maxPriorityFeePerGas) * 1e9 // gwei to wei
        }

        const txRes = await signer.sendTransaction(txArgs)
        await txRes.wait()
        const endTokenAmount = ethers.utils.formatUnits(await tokenContract.balanceOf(userWallet), decimals)      

        return {
            hash: txRes.hash,
            spent: ethAmount,
            recieved: endTokenAmount - startTokenAmount
        }

    } catch (e) {
        console.log(e)
        return "error"
    }

}

module.exports = { buy };