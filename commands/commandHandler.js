const settings = require("./settings/settings")
const buy = require("./buy/buy");
const holding = require("./holding/holding");
const setup = require("./setup/setup");
const wallet = require("./wallet/wallet");
const referral = require("./referral/referral");
const exportKey = require("./exportKey/exportKey");

module.exports = async (interaction) => {

    try {

        switch(interaction.commandName) {
            case 'settings':
                settings(interaction)
                break;
            case 'buy':
                buy(interaction, interaction.options.getString('contract'))
                break;
            case 'holding':
                holding(interaction)
                break;
            case 'setup':
                setup(interaction)
                break;
            case 'wallet':
                wallet(interaction)
                break;
            case 'referrals':
                referral(interaction)
                break;
            case 'exportkey':
                exportKey(interaction)
                break;
        }

    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
    }
}