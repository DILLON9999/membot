const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = async (defaultValue) => {

    const purchaseModal = new ModalBuilder()
        .setCustomId('purchaseModal')
        .setTitle('Confirm Your Purchase');
    const ethInput = new TextInputBuilder()
        .setCustomId('ethInput')
        .setLabel("ETH to send")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    const purchasePassword = new TextInputBuilder()
        .setCustomId('purchasePassword')
        .setLabel("Wallet Password")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    const actionRowOne = new ActionRowBuilder().addComponents(ethInput);
    const actionRowTwo = new ActionRowBuilder().addComponents(purchasePassword)
    await purchaseModal.addComponents(actionRowOne, actionRowTwo);

    if (defaultValue) {
        ethInput.setValue(defaultValue)
    }

    return purchaseModal

}