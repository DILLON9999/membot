const { SlashCommandBuilder } = require('discord.js');

const purchaseCommand = new SlashCommandBuilder()
    .setName('purchase')
    .setDescription('Place trade on contract')
    .addStringOption(option =>
        option.setName('contract')
            .setDescription('Contract address')
            .setRequired(true))

const holdingCommand = new SlashCommandBuilder()
    .setName('holding')
    .setDescription('View tokens currently held in wallet')

const setupCommand = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup your trading wallet')

const settingsCommand = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Change your default transaction settings')

const exportPrivateKeyCommand = new SlashCommandBuilder()
    .setName('exportkey')
    .setDescription('Get your wallets private key to export your account')
    .addStringOption(option =>
        option.setName('password')
            .setDescription('Your wallets password')
            .setRequired(true))

module.exports = { purchaseCommand, holdingCommand, setupCommand, settingsCommand, exportPrivateKeyCommand };