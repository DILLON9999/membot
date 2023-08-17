const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { User } = require('../../database/model');
const settingsModal = require('./Components/settingsModal')
const settingsEmbed = require('./Components/settingsEmbed')

module.exports = async (interaction) => {
    try {

        let user = await User.findOne({ discordId: interaction.user.id })
        let buttonId = interaction.customId.split(':')
        /* module:button:userId */

        if (buttonId[1] == 'changesettings') {

            // Show settings modal
            await interaction.showModal(await settingsModal());
            const collectorFilter = i => i.user.id === interaction.user.id;
            const submitConfirmation = await interaction.awaitModalSubmit({ filter: collectorFilter, time: 1200000 });

            // Modal inputs
            const slippageInput = submitConfirmation.fields.getTextInputValue('slippageInput');
            const maxGasInput = submitConfirmation.fields.getTextInputValue('maxGasInput');
            const gasLimitInput = submitConfirmation.fields.getTextInputValue('gasLimitInput');
            // const buyDeltaInput = submitConfirmation.fields.getTextInputValue('buyDeltaInput');
            // const sellDeltaInput = submitConfirmation.fields.getTextInputValue('sellDeltaInput');

            if (slippageInput) { user.defaultSlippage = slippageInput }
            if (maxGasInput) { user.maxGas = maxGasInput }
            if (gasLimitInput) { user.gasLimit = gasLimitInput }
            // if (buyDeltaInput) { user.buyDelta = buyDeltaInput }
            // if (sellDeltaInput) { user.sellDelta = sellDeltaInput }

            await user.save()

            await submitConfirmation.update({ content: `Settings Updated`, embeds: await settingsEmbed(user) })

        }

    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
    }
}