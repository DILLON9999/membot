const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const ethButtons = async () => {

    const pointOneEth = new ButtonBuilder()
        .setCustomId('pointOneEth')
        .setLabel('0.1 ETH')
        .setStyle(ButtonStyle.Success);

    const pointTwoFiveEth = new ButtonBuilder()
        .setCustomId('pointTwoFiveEth')
        .setLabel('0.25 ETH')
        .setStyle(ButtonStyle.Success);

    const pointFiveEth = new ButtonBuilder()
        .setCustomId('pointFiveEth')
        .setLabel('0.5 ETH')
        .setStyle(ButtonStyle.Success);

    const oneEth = new ButtonBuilder()
        .setCustomId('oneEth')
        .setLabel('1 ETH')
        .setStyle(ButtonStyle.Success);

    const customEth = new ButtonBuilder()
        .setCustomId('customEth')
        .setLabel('Custom Amount')
        .setStyle(ButtonStyle.Primary)

    const row = new ActionRowBuilder()
        .addComponents(pointOneEth, pointTwoFiveEth, pointFiveEth, oneEth, customEth);

    return row

}

module.exports = { ethButtons }