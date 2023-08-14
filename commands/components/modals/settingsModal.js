const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const settingsModal = async (defaultValue) => {

    const settingsModal = new ModalBuilder()
        .setCustomId('settingsModal')
        .setTitle('Update your wallet settings here');

    const slippageInput = new TextInputBuilder()
        .setCustomId('slippageInput')
        .setLabel("Slippage Percent")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const maxGasInput = new TextInputBuilder()
        .setCustomId('maxGasInput')
        .setLabel("Max Gas (GWEI)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const gasLimitInput = new TextInputBuilder()
        .setCustomId('gasLimitInput')
        .setLabel("Gas Limit (WEI)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const buyDeltaInput = new TextInputBuilder()
        .setCustomId('buyDeltaInput')
        .setLabel("Buy Delta (GWEI)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const sellDeltaInput = new TextInputBuilder()
        .setCustomId('sellDeltaInput')
        .setLabel("Sell Delta (GWEI)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const firstActionRow = new ActionRowBuilder().addComponents(slippageInput);
    const secondActionRow = new ActionRowBuilder().addComponents(maxGasInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(gasLimitInput);
    const fourthActionRow = new ActionRowBuilder().addComponents(buyDeltaInput);
    const fifthActionRow = new ActionRowBuilder().addComponents(sellDeltaInput);

    // Add inputs to the modal
    await settingsModal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

    return settingsModal

}

module.exports = { settingsModal }