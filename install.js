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

        // Handle buy options autocomplete
        else if (interaction.isAutocomplete()) {

            try {

                let user = await User.findOne({ discordId: interaction.user.id });
                if (!user) {
                    return;
                }        

                // Get held tokens and make list of options
                let tokens = user.tokens
                let tokenOptions = []
                if (tokens.length > 25) { return; }
                for (let i = 0; i < tokens.length; i++) {
                    tokenOptions.push(tokens[i].name)
                }

                const focusedValue = interaction.options.getFocused();
                const filtered = tokenOptions.filter(choice => (choice.toLowerCase()).startsWith(focusedValue.toLowerCase()));

                // Respond with token names and their address as the value
                await interaction.respond(
                    filtered.map(choice => ({ name: choice, value: (tokens.find(obj => obj.name === choice).address) })),
                );

            } catch (e) {
                console.log(e)
                return;
            }
        }
    });
}

module.exports = { installCommands, registerInteractions, client };