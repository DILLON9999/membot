const { SlashCommandBuilder } = require('discord.js');

const buyCommand = new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Place trade on contract')
    .addStringOption(option =>
        option.setName('contract')
            .setDescription('Contract address')
            .setRequired(true)
            .setAutocomplete(true));

const holdingCommand = new SlashCommandBuilder()
    .setName('holding')
    .setDescription('View tokens currently held in wallet')
    .addStringOption(option =>
        option.setName('add')
            .setDescription('Add a token to your holdings list'))

const setupCommand = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup your trading wallet')

const settingsCommand = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Change your default transaction settings')
    .addBooleanOption(option =>
		option.setName('mev_protection')
			.setDescription('Choose to enable or disable mev protection'));

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

const referralCommand = new SlashCommandBuilder()
    .setName('referrals')
    .setDescription('View your referral code and uses')
    .addStringOption(option =>
        option.setName('use')
            .setDescription('Use anothers referral code'))


module.exports = { buyCommand, holdingCommand, setupCommand, settingsCommand, getWalletCommand, exportPrivateKeyCommand, referralCommand };