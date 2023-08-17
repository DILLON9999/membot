const { Client, Collection, Events, GatewayIntentBits, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { buyCommand, holdingCommand, setupCommand, settingsCommand, exportPrivateKeyCommand, getWalletCommand, referralCommand } = require('./commands/commands');
const { User } = require('./database/model');
const buttonHandler = require('./commands/buttonHandler');
const commandHandler = require('./commands/commandHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

const installCommands = () => {
    client.application.commands.create(buyCommand)
    client.application.commands.create(holdingCommand)
    client.application.commands.create(setupCommand)
    client.application.commands.create(settingsCommand)
    client.application.commands.create(exportPrivateKeyCommand)
    client.application.commands.create(getWalletCommand)
    client.application.commands.create(referralCommand)
}

const registerInteractions = () => {
    client.on(Events.InteractionCreate, async interaction => {

        if (interaction.isButton()) {
            buttonHandler(interaction)
        } 

        else if (interaction.isChatInputCommand()) {
            commandHandler(interaction)
        }

    });
}

module.exports = { installCommands, registerInteractions, client };