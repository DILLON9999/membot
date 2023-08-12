const { Client, Collection, Events, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { purchaseCommand, holdingCommand, setupCommand, settingsCommand, exportPrivateKeyCommand } = require('./commands/commands');
const { purchase, setup, holding, passwordSubmit, settings, changeSettings, updateSettings, exportPrivateKey } = require('./commands/handlers');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

const installCommands = () => {
    client.application.commands.create(purchaseCommand)
    client.application.commands.create(holdingCommand)
    client.application.commands.create(setupCommand)
    client.application.commands.create(settingsCommand)
    client.application.commands.create(exportPrivateKeyCommand)
}

const registerInteractions = () => {
    client.on(Events.InteractionCreate, async interaction => {
        if (interaction.commandName == 'ping') {
            pingInteraction(interaction);
        } else if (interaction.commandName == 'purchase') {
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
        }
    });
}

module.exports = { installCommands, registerInteractions, client };