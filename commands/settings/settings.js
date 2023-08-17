const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { User } = require('../../database/model');
const settingsEmbed= require('./Components/settingsEmbed');
const settingsButtons = require('./Components/settingsButtons');

module.exports = async (interaction) => {

    try {

        // Check for user
        let user = await User.findOne({ discordId: interaction.user.id });
        if (!user) {
            await interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
            return;
        }

        // Change mev protection options
        if (interaction.options.getBoolean('mev_protection') != null) {
            user.mevProtectionOn = interaction.options.getBoolean('mev_protection')
            await user.save()
            await interaction.reply(`Mev settings updated to: \`${interaction.options.getBoolean('mev_protection')}\``);
            return
        }

        // Send message
        await interaction.reply({ embeds: await settingsEmbed(user), components: await settingsButtons(interaction) })

    } catch (e) {
        console.log(e)
        // if (!e.code == 'InteractionCollectorError') {
        //     console.log(e)
        // }
    }
}