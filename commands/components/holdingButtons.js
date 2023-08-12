const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const holdingButtons = async (tokensList, index) => {

    // Top Row
    const prev = new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('Prev')
        .setStyle(ButtonStyle.Success);

    const next = new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next')
        .setStyle(ButtonStyle.Success);

    // Disable previous button if looking at start of list
    if (index == 0) { prev.setDisabled(true) }

    // Disable next button if looking at end of list
    if (!tokensList[index+1]) { next.setDisabled(true) }

    // Bottom Row
    const sellQuarter = new ButtonBuilder()
        .setCustomId('sellQuarter')
        .setLabel('Sell 25%')
        .setStyle(ButtonStyle.Primary);

    const sellHalf = new ButtonBuilder()
        .setCustomId('sellHalf')
        .setLabel('Sell 50%')
        .setStyle(ButtonStyle.Primary);

    const sellThreeQuarters = new ButtonBuilder()
        .setCustomId('sellThreeQuarters')
        .setLabel('Sell 75%')
        .setStyle(ButtonStyle.Primary)

    const sellFull = new ButtonBuilder()
        .setCustomId('sellFull')
        .setLabel('Sell 100%')
        .setStyle(ButtonStyle.Primary)

    const topRow = new ActionRowBuilder()
        .addComponents(prev, next);

    const bottomRow = new ActionRowBuilder()
        .addComponents(sellQuarter, sellHalf, sellThreeQuarters, sellFull)

    return [topRow, bottomRow]

}

module.exports = { holdingButtons }