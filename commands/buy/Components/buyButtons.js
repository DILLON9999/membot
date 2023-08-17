const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = async (interaction, contract) => {

    const pointOneEth = new ButtonBuilder()
        .setCustomId(`buy:pointOneEth:${interaction.user.id}:${contract}`)
        .setLabel('0.1 ETH')
        .setStyle(ButtonStyle.Success);

    const pointTwoFiveEth = new ButtonBuilder()
        .setCustomId(`buy:pointTwoFiveEth:${interaction.user.id}:${contract}`)
        .setLabel('0.25 ETH')
        .setStyle(ButtonStyle.Success);

    const pointFiveEth = new ButtonBuilder()
        .setCustomId(`buy:pointFiveEth:${interaction.user.id}:${contract}`)
        .setLabel('0.5 ETH')
        .setStyle(ButtonStyle.Success);

    const oneEth = new ButtonBuilder()
        .setCustomId(`buy:oneEth:${interaction.user.id}:${contract}`)
        .setLabel('1 ETH')
        .setStyle(ButtonStyle.Success);

    const customEth = new ButtonBuilder()
        .setCustomId(`buy:customEth:${interaction.user.id}:${contract}`)
        .setLabel('Custom Amount')
        .setStyle(ButtonStyle.Primary)

    const row = new ActionRowBuilder()
        .addComponents(pointOneEth, pointTwoFiveEth, pointFiveEth, oneEth, customEth);

    return row

}