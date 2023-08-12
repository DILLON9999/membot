const { ethers, BigNumber } = require('ethers')
const JSBI = require('jsbi')
const { SupportedChainId, Token, Percent, CurrencyAmount, TradeType } = require('@uniswap/sdk-core')
const { AlphaRouter, ChainId, SwapOptionsSwapRouter02, SwapRoute, SwapType } = require('@uniswap/smart-order-router')

const oldSwap = async (toContract, userWallet, slipPercent, ethAmount, gasLimit, walletSecret) => {

    const mainnet = 1
    const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/d25074e260984463be075e88db795106")
    const routerAddress = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"

    const WETH_TOKEN = await new Token(
        mainnet,
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        18,
        'WETH',
        'Wrapped Ether'
    )

    const TO_TOKEN = await new Token(
        mainnet,
        toContract,
        18,
        'UNI',
        'Uniswap'
    )

    const router = new AlphaRouter({
        chainId: mainnet,
        provider: provider,
    })

    const options = {
        recipient: userWallet, // Wallet address
        slippageTolerance: new Percent(slipPercent, 100),
        deadline: Math.floor(Date.now() / 1000 + 1800),
        // type: SwapType.SWAP_ROUTER_02,
    }

    const route = await router.route(
        CurrencyAmount.fromRawAmount(
            WETH_TOKEN, // Input Token
            JSBI.BigInt(ethers.utils.parseUnits(ethAmount, 18))
        ),
        TO_TOKEN, // Output token
        TradeType.EXACT_INPUT,
        options
    )

    // console.log(`Gas Price Wei: ${route.gasPriceWei}`)

    const transaction = {
        data: route.methodParameters.calldata,
        to: routerAddress, // V3 Swap Router Address
        value: BigNumber.from(route.methodParameters.value),
        from: userWallet, // wallet address
        gasPrice: BigNumber.from(route.gasPriceWei),
        gasLimit: ethers.utils.hexlify(gasLimit) // 1000000
        // gasLimit: 20000,
        // gasPrice: 15000000000 * 2
    }

    const wallet = new ethers.Wallet(walletSecret) // wallet secret
    const connectedWallet = wallet.connect(provider)

    const approvalAmount = ethers.utils.parseUnits('1', 18).toString()
    const ERC20ABI = require('../../abi.json')
    const contract0 = new ethers.Contract("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" /* weth addy */, ERC20ABI, provider)

    await contract0.connect(connectedWallet).approve(
        routerAddress, // v3 swap router address
        approvalAmount
    )

    const txRes = await connectedWallet.sendTransaction(transaction)

    return txRes.hash

    console.log(`Transaction Hash: ${txRes.hash}`)

}

const buy = async (contract, userWallet, slipPercent, ethAmount, maxFeePerGas, maxPriorityFeePerGas, gasLimit, buyDelta, walletSecret) => {

    try {
        const { abi: V3SwapRouterABI } = require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json')

        const ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
        const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
        const INFURA_URL = 'https://mainnet.infura.io/v3/d25074e260984463be075e88db795106'

        const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)
        const signer = new ethers.Wallet(walletSecret, provider)

        const router = new ethers.Contract(
            ROUTER_ADDRESS,
            V3SwapRouterABI
        )

        const inputAmount = ethers.utils.parseEther(ethAmount)

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
        const receipt = await txRes.wait()
        return txRes.hash

    } catch (e) {
        console.log(e)
        return "error"
    }

}

module.exports = { buy };