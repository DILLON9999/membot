const { Client, Collection, Events, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { buyCommand, holdingCommand, setupCommand, settingsCommand, exportPrivateKeyCommand, getWalletCommand, referralCommand } = require('./commands/commands');
const { purchase, setup, holding, settings, exportPrivateKey, getWallet, referrals } = require('./commands/handlers');

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
        if (interaction.commandName == 'ping') {
            pingInteraction(interaction);
        } else if (interaction.commandName == 'buy') {
            await purchase(interaction, interaction.options.getString('contract'));
        } else if (interaction.commandName == 'setup') {
            await setup(interaction)
        } else if (interaction.commandName == 'holding') {
            await holding(interaction);
        } else if (interaction.commandName == 'exportkey') {
            await exportPrivateKey(interaction)
        } else if (interaction.commandName == 'settings') {
            await settings(interaction)
        } else if (interaction.commandName == 'wallet') {
            await getWallet(interaction)
        } else if (interaction.commandName == 'referrals') {
            await referrals(interaction)
        }

    });
}

module.exports = { installCommands, registerInteractions, client };