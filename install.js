const { Client, Collection, Events, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { buyCommand, holdingCommand, setupCommand, settingsCommand, exportPrivateKeyCommand, getWalletCommand } = require('./commands/commands');
const { purchase, setup, holding, passwordSubmit, settings, changeSettings, updateSettings, exportPrivateKey, getWallet } = require('./commands/handlers');

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
}

const registerInteractions = () => {
    client.on(Events.InteractionCreate, async interaction => {
        if (interaction.commandName == 'ping') {
            pingInteraction(interaction);
        } else if (interaction.commandName == 'buy') {
            await purchase(interaction);
        } else if (interaction.commandName == 'setup') {
            await setup(interaction)
        } else if (interaction.commandName == 'holding') {
            await holding(interaction);
        } else if (interaction.customId == 'setupModal') {
            await passwordSubmit(interaction)
        } else if (interaction.commandName == 'exportkey') {
            await exportPrivateKey(interaction)
        } else if (interaction.commandName == 'settings') {
            await settings(interaction)
        } else if (interaction.customId == 'changesettings') {
            await changeSettings(interaction)
        } else if (interaction.customId == 'settingsModal') {
            await updateSettings(interaction)
        } else if (interaction.commandName == 'wallet') {
            await getWallet(interaction)
        }

    });
}

module.exports = { installCommands, registerInteractions, client };