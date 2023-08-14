const settingsEmbed = async (user) => {

    return [
        {
            "type": "rich",
            "title": `Your Wallet Settings`,
            "description": "",
            "color": 0x00FFFF,
            "fields": [
                {
                    "name": `Slippage`,
                    "value": `\`${user.defaultSlippage}%\``,
                    "inline": true
                },
                {
                    "name": `Max Gas`,
                    "value": `\`${user.maxGas ? `${user.maxGas} GWEI` : 'Unset'}\``
                },
                {
                    "name": `Gas Limit`,
                    "value": `\`${user.gasLimit} WEI\``
                },
                {
                    "name": `Buy Delta`,
                    "value": `\`${user.buyDelta} GWEI\``
                },
                {
                    "name": `Sell Delta`,
                    "value": `\`${user.sellDelta} GWEI\``
                }
            ]
        }
    ]

}

module.exports = { settingsEmbed };