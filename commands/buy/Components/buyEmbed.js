const axios = require('axios')

module.exports = async (address) => {

    let embed;
    let saveData = {
        "address": address,
        "decimals": 18,
        "symbol": "unknown",
        "name": "unknown",
    }
    let respCode;

    try {
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://api.geckoterminal.com/api/v2/networks/eth/tokens/${address}`,
        };

        await axios.request(config)
            .then((response) => {

                const data = response.data.data.attributes

                embed = [
                    {
                        "type": "rich",
                        "title": `${data.name} (${data.symbol})`,
                        "description": "",
                        "color": 0x00FFFF,
                        "fields": [
                            {
                                "name": `Address`,
                                "value": `[${data.address}](https://etherscan.io/token/${data.address})`
                            },
                            {
                                "name": `Total Supply`,
                                "value": `\`${data.total_supply.slice(0, -(data.decimals+2))}\``
                            },
                            {
                                "name": `FDV ($)`,
                                "value": `\`${Math.round(parseFloat(data.fdv_usd) * 100) / 100}\``
                            },
                            {
                                "name": `Reserve ($)`,
                                "value": `\`${Math.round( (parseFloat(data.total_reserve_in_usd)) * 2 * 100) / 100}\``
                            },
                            {
                                "name": `24 Hour Volume ($)`,
                                "value": `\`${Math.round(parseFloat(data.volume_usd.h24) * 100) / 100}\``
                            },
                            {
                                "name": `Market Cap ($)`,
                                "value": `\`${Math.round(parseFloat(data.market_cap_usd) * 100) / 100}\``
                            }
                        ]
                    }
                ]

                saveData = {
                    "address": data.address,
                    "decimals": data.decimals,
                    "symbol": data.symbol,
                    "name": data.name,
                }

                respCode = "success"

            })
            .catch((error) => {
                embed = [
                    {
                        "type": "rich",
                        "title": `Error Retrieving Data From Address`,
                        "description": "",
                        "color": 0x00FFFF
                    }
                ]
                respCode = "error"
            });
    } catch (e) {
        embed = [
            {
                "type": "rich",
                "title": `Error Retrieving Data From Address`,
                "description": "",
                "color": 0x00FFFF
            }
        ]
        respCode = "error"
    }

    return { respCode, embed, saveData }

}