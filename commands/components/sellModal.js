const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const sellModal = async () => {

    const sellModal = new ModalBuilder()
        .setCustomId('sellModal')
        .setTitle('Confirm Your Sale');
    const sellPassword = new TextInputBuilder()
        .setCustomId('sellPassword')
        .setLabel("Wallet Password")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    const actionRow = new ActionRowBuilder().addComponents(sellPassword);
    await sellModal.addComponents(actionRow);

    return sellModal

}

module.exports = { sellModal }