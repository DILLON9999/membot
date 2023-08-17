const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { User } = require('../../database/model');
const walletEmbed = require('./Components/walletEmbed');
const walletButtons = require('./Components/walletButtons');

module.exports = async (interaction) => {

    try {

        // Check for user
        const user = await User.findOne({ discordId: interaction.user.id });
        if (!user) {
            interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
            return;
        }

        await interaction.reply({ content: user.walletAddress, embeds: await walletEmbed(user), components: [await walletButtons(interaction, user)] })


    } catch (e) {
        console.log(e)
        // if (!e.code == 'InteractionCollectorError') {
        //     console.log(e)
        // }
    }
}