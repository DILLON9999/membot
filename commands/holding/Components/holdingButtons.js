const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = async (interaction, tokensList, index) => {
    // Arrow Keys
    const prev = new ButtonBuilder()
        .setCustomId(`scroll:prev:${interaction.user.id}`)
        .setLabel('Prev')
        .setStyle(ButtonStyle.Success);

    const next = new ButtonBuilder()
        .setCustomId(`scroll:next:${interaction.user.id}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Success);

    // Disable previous button if looking at start of list
    if (index == 0) { prev.setDisabled(true) }

    // Disable next button if looking at end of list
    if (!tokensList[index + 1]) { next.setDisabled(true) }

    // Selling Options
    const sellQuarter = new ButtonBuilder()
        .setCustomId(`holding:sellQuarter:${interaction.user.id}:${tokensList[index].address}`)
        .setLabel('Sell 25%')
        .setStyle(ButtonStyle.Primary);

    const sellHalf = new ButtonBuilder()
        .setCustomId(`holding:sellHalf:${interaction.user.id}:${tokensList[index].address}`)
        .setLabel('Sell 50%')
        .setStyle(ButtonStyle.Primary);

    const sellThreeQuarters = new ButtonBuilder()
        .setCustomId(`holding:sellThreeQuarters:${interaction.user.id}:${tokensList[index].address}`)
        .setLabel('Sell 75%')
        .setStyle(ButtonStyle.Primary)

    const sellFull = new ButtonBuilder()
        .setCustomId(`holding:sellFull:${interaction.user.id}:${tokensList[index].address}`)
        .setLabel('Sell 100%')
        .setStyle(ButtonStyle.Primary)

    // Withdraw
    const withdraw = new ButtonBuilder()
        .setCustomId(`holding:withdraw:${interaction.user.id}:${tokensList[index].address}`)
        .setLabel('Withdraw')
        .setStyle(ButtonStyle.Secondary)

    // const remove = new ButtonBuilder()
    //     .setCustomId(`holding:remove:${interaction.user.id}`)
    //     .setLabel('Remove')
    //     .setStyle(ButtonStyle.Danger)



    const topRow = new ActionRowBuilder()
        .addComponents(prev, next);

    const middleRow = new ActionRowBuilder()
        .addComponents(sellQuarter, sellHalf, sellThreeQuarters, sellFull)

    const bottomRow = new ActionRowBuilder()
        .addComponents(withdraw)

    return [topRow, middleRow, bottomRow]

}