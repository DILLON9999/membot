const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = async (interaction) => {
    const changeSettings = new ButtonBuilder()
        .setCustomId(`settings:changesettings:${interaction.user.id}`)
        .setLabel('Change Settings')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
        .addComponents(changeSettings);

    return [row]
}