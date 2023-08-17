const buyButtonHandler = require("./buy/buyButtonHandler");
const holdingButtonHandler = require("./holding/holdingButtonHandler");
const settingsButtonHandler = require("./settings/settingsButtonHandler");
const walletButtonHandler = require("./wallet/walletButtonHandler");

module.exports = async (interaction) => {

    try {

        // Parse buttonId into sections
        const idParts = interaction.customId.split(':');
        const module = idParts[0]
        const buttonId = idParts[1];
        const userId = idParts[2];


        // Respond if incorect user selects button
        if (userId !== interaction.user.id) {
            return interaction.reply({
                content: "This button is not for you",
                ephemeral: true
            })
        }

        // Send button to correct command handler
        switch (module) {
            case 'settings':
                settingsButtonHandler(interaction)
                break;
            case 'buy':
                buyButtonHandler(interaction)
                break;
            case 'holding':
                holdingButtonHandler(interaction)
                break;
            case 'wallet':
                walletButtonHandler(interaction)
                break;
        }

    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
    }
}
