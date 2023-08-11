const axios = require('axios')

const tokenData = async (address) => {

    try {
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://api.geckoterminal.com/api/v2/networks/eth/tokens/${address}`,
        };

        let embed;

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
                                "value": `\`${data.total_supply}\``
                            },
                            {
                                "name": `Fully Diluted Value ($)`,
                                "value": `\`${Math.round(parseFloat(data.fdv_usd) * 100) / 100}\``
                            },
                            {
                                "name": `Reserve ($)`,
                                "value": `\`${Math.round(parseFloat(data.total_reserve_in_usd) * 100) / 100}\``
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

            });

        return embed
    } catch (e) {
        return [
            {
                "type": "rich",
                "title": `Error Retrieving Data From Address`,
                "description": "",
                "color": 0x00FFFF
            }
        ]
    }

}

module.exports = { tokenData };