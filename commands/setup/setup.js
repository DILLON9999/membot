const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { User } = require('../../database/model');
const Web3 = require('web3').default;
const web3 = new Web3(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);
const bcrypt = require('bcrypt');
const setupModal = require('./Components/setupModal');
const saltRounds = 10;

module.exports = async (interaction) => {

    try {

        // Check for user
        let user = await User.findOne({ discordId: interaction.user.id });
        if (user) {
            await interaction.reply({ content: `You have already created a wallet` })
            return;
        }

        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            await interaction.showModal(await setupModal());
            const submitConfirmation = await interaction.awaitModalSubmit({ filter: collectorFilter, time: 1200000 });

            // get password from modal
            const password = submitConfirmation.fields.getTextInputValue('passwordInput');

            //Generate a new account
            const account = await web3.eth.accounts.create();

            // Encrypt private key and password
            const encryptedPrivateKey = await web3.eth.accounts.encrypt(account.privateKey, password);
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            user = new User({
                discordId: interaction.user.id,
                username: interaction.user.username,
                referralUses: 0,
                walletAddress: account.address,
                encryptedPrivateKey,
                password: hashedPassword,
                defaultSlippage: "25", // default
                maxFeePerGas: "100", // default
                maxPriorityFeePerGas: "5", // default
                gasLimit: "1000000", // default
                buyDelta: "5", // default
                sellDelta: "15" // default        
            });
            await user.save();
            await submitConfirmation.reply({ content: `Your wallet address is: \`${account.address}\`` })

        } catch (e) {
            console.log(e)
            if (!e.code == 'InteractionCollectorError') {
                console.log(e)
            }
            // await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            return
        }


    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
    }
}