const { SlashCommandBuilder } = require('discord.js');

const buyCommand = new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Place trade on contract')
    .addStringOption(option =>
        option.setName('contract')
            .setDescription('Contract address')
            .setRequired(true))

const holdingCommand = new SlashCommandBuilder()
    .setName('holding')
    .setDescription('View tokens currently held in wallet')
    .addStringOption(option =>
        option.setName('password')
            .setDescription('Your wallets password')
            .setRequired(true))


const setupCommand = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup your trading wallet')

const settingsCommand = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Change your default transaction settings')

const getWalletCommand = new SlashCommandBuilder()
    .setName('wallet')
    .setDescription('Get your trading wallet')

const exportPrivateKeyCommand = new SlashCommandBuilder()
    .setName('exportkey')
    .setDescription('Get your wallets private key to export your account')
    .addStringOption(option =>
        option.setName('password')
            .setDescription('Your wallets password')
            .setRequired(true))

module.exports = { buyCommand, holdingCommand, setupCommand, settingsCommand, getWalletCommand, exportPrivateKeyCommand };