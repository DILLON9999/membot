const axios = require('axios')

const heldTokenData = async (address, amountHeld) => {

    let embed;
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
                        "title": `Holding: ${data.name}`,
                        "description": `${amountHeld} ${data.symbol}`,
                        "color": 0x00FFFF,
                        "fields": [
                            {
                                "name": `Total Supply`,
                                "value": `\`${data.total_supply}\``
                            },
                            {
                                "name": `Fully Diluted Value ($)`,
                                "value": `\`${Math.round(parseFloat(data.fdv_usd) * 100) / 100}\``,
                                "inline": true
                            },
                            {
                                "name": `Reserve ($)`,
                                "value": `\`${Math.round(parseFloat(data.total_reserve_in_usd) * 100) / 100}\``,
                                "inline": true
                            },
                            {
                                "name": ` `,
                                "value": ` `
                            },
                            {
                                "name": `24 Hour Volume ($)`,
                                "value": `\`${Math.round(parseFloat(data.volume_usd.h24) * 100) / 100}\``,
                                "inline": true
                            },
                            {
                                "name": `Market Cap ($)`,
                                "value": `\`${Math.round(parseFloat(data.market_cap_usd) * 100) / 100}\``
                            }
                        ]
                    }
                ]

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

    return { respCode, embed }

}

module.exports = { heldTokenData };