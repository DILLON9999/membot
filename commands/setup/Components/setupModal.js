const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = async () => {

    const setupModal = new ModalBuilder()
        .setCustomId('setupModal')
        .setTitle('Setup Your Trading Wallet');
    const passwordInput = new TextInputBuilder()
        .setCustomId('passwordInput')
        .setLabel("Wallet Password")
        .setStyle(TextInputStyle.Short)
        .setMinLength(5)
        .setRequired(true)
    const actionRow = new ActionRowBuilder().addComponents(passwordInput);
    setupModal.addComponents(actionRow);

    return setupModal

}