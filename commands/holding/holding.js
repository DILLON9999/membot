const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { User } = require('../../database/model');
const buyEmbed = require('../buy/Components/buyEmbed');
const { holdingUI } = require('./holdingUI')

module.exports = async (interaction, contract) => {

    try {

        // Check for user
        let user = await User.findOne({ discordId: interaction.user.id });
        if (!user) {
            await interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
            return;
        }

        if (!user.tokens || user.tokens.length == 0) {
            await interaction.reply("You are not currently holding or tracking any tokens")
            return
        }

        // ADD - Optional
        if (interaction.options.getString('add')) {

            const addTokenData = await buyEmbed(interaction.options.getString('add'))

            let addToken = true
            for (let i = 0; i < user.tokens.length; i++) {
                if (user.tokens[i].address == addTokenData.saveData.address) { addToken = false }
            }
            if (addToken) {
                user.tokens.push(addTokenData.saveData);
                await user.save()
                await interaction.reply(`\`${addTokenData.saveData.symbol}\` has been added to your holdings list.`);
                return
            } else {
                await interaction.reply('Token is already in your holdings list.')
                return
            }

        }

        // Set reply to edit later
        await interaction.reply("Checking Tokens...")

        // Call the holding UI
        await holdingUI(interaction, user.tokens, 0, user.walletAddress)

    } catch (e) {
        console.log(e)
        // if (!e.code == 'InteractionCollectorError') {
        //     console.log(e)
        // }
    }
}