const { ethers } = require('ethers');
const ethersProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);

module.exports = async (user) => {
    return [
        {
            "type": "rich",
            "title": "",
            "description": "",
            "color": 0x00FFFF,
            "fields": [
                {
                    "name": `Wallet Address`,
                    "value": `\`${user.walletAddress}\``
                },
                {
                    "name": `Balance`,
                    "value": `\`${Number(ethers.utils.formatUnits(await ethersProvider.getBalance(user.walletAddress), 18)).toFixed(4)} ETH\``
                }
            ]
        }
    ]
}