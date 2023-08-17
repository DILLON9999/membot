const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { User } = require('../../database/model');
const buyEmbed = require('./Components/buyEmbed');
const buyButtons = require('./Components/buyButtons');

module.exports = async (interaction, contract) => {

    try {

        // Check for user
        let user = await User.findOne({ discordId: interaction.user.id });
        if (!user) {
            await interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
            return;
        }

        // Send message embed from given contract
        const dataEmbed = await buyEmbed(contract)

        // Send data with purchase buttons
        await interaction.reply({
            embeds: dataEmbed.embed,
            components: [await buyButtons(interaction, contract)]
        })

    } catch (e) {
        console.log(e)
        // if (!e.code == 'InteractionCollectorError') {
        //     console.log(e)
        // }
    }
}