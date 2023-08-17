module.exports = async (txRes, inSymbol, outSymbol) => {

    return [
        {
            "type": "rich",
            "title": `Swap Confirmed`,
            "description": "",
            "color": 0x00FFFF,
            "fields": [
                {
                    "name": `Amount In - ${inSymbol}`,
                    "value": `\`${txRes.recieved}\``
                },
                {
                    "name": `Amount Out - ${outSymbol}`,
                    "value": `\`${txRes.spent}\``,
                },
                {
                    "name": `Etherscan`,
                    "value": `[${txRes.hash}](https://etherscan.io/tx/${txRes.hash})`
                },
            ]
        }
    ]

}