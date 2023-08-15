const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const withdrawModal = async (defaultValue) => {

    const withdrawModal = new ModalBuilder()
        .setCustomId('withdrawModal')
        .setTitle('Withdraw');
    const ethInput = new TextInputBuilder()
        .setCustomId('ethInput')
        .setLabel("Amount To Withdraw")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    const withdrawWallet = new TextInputBuilder()
        .setCustomId('withdrawWallet')
        .setLabel("Wallet To Withdraw To")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    const withdrawPassword = new TextInputBuilder()
        .setCustomId('withdrawPassword')
        .setLabel("Wallet Password")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    const actionRowOne = new ActionRowBuilder().addComponents(ethInput);
    const actionRowTwo = new ActionRowBuilder().addComponents(withdrawWallet)
    const actionRowThree = new ActionRowBuilder().addComponents(withdrawPassword)
    await withdrawModal.addComponents(actionRowOne, actionRowTwo, actionRowThree);

    return withdrawModal

}

module.exports = { withdrawModal }