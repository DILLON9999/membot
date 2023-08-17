const { User } = require('../../database/model');
const Web3 = require('web3').default;
const web3 = new Web3(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);

module.exports = async (interaction) => {

    // Check if user exists in db
    const user = await User.findOne({ discordId: interaction.user.id });
    if (!user) {
        interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
        return;
    }

    const password = interaction.options.getString('password')

    try {
        walletSecret = (await web3.eth.accounts.decrypt(user.encryptedPrivateKey, password)).privateKey
        interaction.reply({ content: `Private Key: \`${walletSecret}\``, ephemeral: true });
        return;
    } catch {
        interaction.reply('Incorrect password.')
        return;
    }
} 