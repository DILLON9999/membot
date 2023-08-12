const axios = require('axios');

const webhook = async (name, symbol, ethAmount, txRes) => {

    try {
        let data = JSON.stringify({
            "content": null,
            "embeds": [
                {
                    "title": "Successful Swap",
                    "color": 5814783,
                    "fields": [
                        {
                            "name": "Token Name",
                            "value": `\`${name}\``
                        },
                        {
                            "name": "Symbol",
                            "value": `\`${symbol}\``
                        },
                        {
                            "name": "Amount",
                            "value": `\`${ethAmount} ETH\``
                        },
                        {
                            "name": "Hash",
                            "value": `[${txRes}](https://etherscan.io/tx/${txRes})`
                        }
                    ]
                }
            ],
            "username": "Membot Swaps",
            "avatar_url": "https://media.discordapp.net/attachments/1138316215866118306/1139684129630339072/Screenshot_2023-08-11_at_6.17.44_PM.png?width=1056&height=1050",
            "attachments": []
        });
    
        let config = {
            method: 'post',
            url: 'https://discord.com/api/webhooks/1139824916217221140/nwrQJ8XriOv0o8kV7Bbh9Jbn61pjk3gKy1bRqArSERG9fKyX0QAiyfCLMOfgsERxq1Xl',
            headers: {
                'Content-Type': 'application/json',
            },
            data: data
        };
    
        await axios.request(config)
            .then((response) => {
            })
            .catch((error) => {
            });    

        return
    } catch (e) {
        console.log('error sending webhook')
        return
    }
    return
}

module.exports = { webhook }