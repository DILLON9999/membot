const ethers = require('ethers');
const genericErc20Abi = require('./commands/trades/abi.json');

async function main() {
    const tokenContractAddress = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984';

    const INFURA_URL = 'https://mainnet.infura.io/v3/d25074e260984463be075e88db795106'
    
    const provider = new ethers.providers.JsonRpcProvider(INFURA_URL)
    
    const contract = new ethers.Contract(tokenContractAddress, genericErc20Abi, provider);
    const balance = ethers.utils.formatUnits(await contract.balanceOf("0x39C933aB34f0D381Ed87D1a19D6F87C5cd03B7b9"), 18)

    console.log(balance)
    
}

main()