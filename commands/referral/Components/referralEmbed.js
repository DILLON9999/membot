module.exports = async (user) => {
    return [
        {
            "type": "rich",
            "title": "",
            "description": "",
            "color": 0x00FFFF,
            "fields": [
                {
                    "name": `Referral Code`,
                    "value": `\`${user.username}\``
                },
                {
                    "name": `Referral Uses`,
                    "value": `\`${user.referralUses}\``
                }
            ]
        }
    ]
}