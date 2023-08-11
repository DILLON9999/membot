const axios = require('axios');
const { User } = require('../database/model');
const { buy } = require('./trades/buy')
const { sell } = require('./trades/sell')
const { client } = require('../install')
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const { tokenData } = require('./helpers/tokenData')
const { ethButtons } = require('./components/ethButtons')
const { purchaseModal } = require('./components/purchaseModal')

const bcrypt = require('bcrypt');
const saltRounds = 10;

const Web3 = require('web3').default;
const infuraApiKey = 'd25074e260984463be075e88db795106';
const web3 = new Web3(`https://mainnet.infura.io/v3/${infuraApiKey}`);

// ** Buy and Sell ** //

const purchase = async (interaction) => {

    const user = await User.findOne({ discordId: interaction.user.id });

    // Check if user has wallet
    if (!user.walletAddress) {
        interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
        return;
    }

    // Pull token data
    const contract = interaction.options.getString('contract');
    const dataEmbed = await tokenData(contract)

    // Send data with purchase buttons
    const amountResponse = await interaction.reply({
        embeds: dataEmbed,
        components: [await ethButtons()]
    })

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {
        const amountConfirmation = await amountResponse.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

        // Set default value for button chosen
        let defaultValue;
        switch (amountConfirmation.customId) {
            case 'pointOneEth':
                defaultValue = "0.1";
                break;
            case 'pointTwoFiveEth':
                defaultValue = "0.25";
                break;
            case 'pointFiveEth':
                defaultValue = "0.5";
                break;
            case 'oneEth':
                defaultValue = "1";
                break;
        }

        // Wait for modal to be submitted
        await amountConfirmation.showModal(await purchaseModal(defaultValue));
        const submitConfirmation = await amountConfirmation.awaitModalSubmit({ filter: collectorFilter, time: 120_000 });
        const password = submitConfirmation.fields.getTextInputValue('purchasePassword');
        const ethAmount = submitConfirmation.fields.getTextInputValue('ethInput')

        // Decrypt wallet
        let walletSecret;
        try {
            walletSecret = (await web3.eth.accounts.decrypt(user.encryptedPrivateKey, password)).privateKey
        } catch {
            submitConfirmation.reply({ content: 'Incorrect password', components: [] });
            return;
        }

        // Send transaction
        await submitConfirmation.update({ content: `Sending purchase for ${ethAmount} ETH`, components: [] });
        const txRes = await buy(contract, user.walletAddress, user.defaultSlippage, ethAmount, user.maxFeePerGas, user.maxPriorityFeePerGas, user.gasLimit, user.buyDelta, walletSecret)
        txRes == 'error' ? submitConfirmation.editReply("Error placing transaction") : submitConfirmation.editReply(`Trade placed: ${txRes}`);
        return

    } catch (e) {
        console.log(e)
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
    }
}

const holding = async (interaction) => {

    // View all tokens held by wallet
    // Let user scroll through

    // Choose percent (25, 50, 75, 100) of the amount held to sell
    // Password modal popup
    // Call sellToken function

}

const sellToken = async (interaction) => {

    const user = await User.findOne({ discordId: interaction.user.id });

    // Check if user has wallet
    if (!user.walletAddress) {
        interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
        return;
    }

    const token = {
        contract: "",
        digits: "",
        symbol: "",
        name: ""
    }

    const sellAmount = 0 // Calculte based off percent of held token user wants to sell

    // Decrypt wallet
    let walletSecret;
    try {
        walletSecret = (await web3.eth.accounts.decrypt(user.encryptedPrivateKey, password)).privateKey
    } catch {
        submitConfirmation.update({ content: 'Incorrect password', components: [] });
        return;
    }


    // token, userWallet, slipPercent, sellAmount, maxFeePerGas, maxPriorityFeePerGas, gasLimit, buyDelta, walletSecret
    sell(token, user.walletAddress, user.defaultSlippage, sellAmount, user.maxFeePerGas, user.maxPriorityFeePerGas, user.gasLimit, user.sellDelta, walletSecret)

}

// ** Create Account ** // 

const setup = async (interaction) => {

    const setupModal = new ModalBuilder()
        .setCustomId('setupModal')
        .setTitle('Setup Your Trading Wallet');

    const passwordInput = new TextInputBuilder()
        .setCustomId('passwordInput')
        .setLabel("Wallet Password")
        .setStyle(TextInputStyle.Short)
        .setMinLength(5)
        .setRequired(true)

    const actionRow = new ActionRowBuilder().addComponents(passwordInput);
    setupModal.addComponents(actionRow);

    await interaction.showModal(setupModal);

}

const passwordSubmit = async (interaction) => {

    const password = interaction.fields.getTextInputValue('passwordInput');

    //Generate a new account
    const account = await web3.eth.accounts.create();

    // Encrypt private key and password
    const encryptedPrivateKey = await web3.eth.accounts.encrypt(account.privateKey, password);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let user = await User.findOne({ discordId: interaction.user.id });
    if (user) {
        await interaction.reply({ content: `You have already created a wallet` })
    } else {
        user = new User({
            discordId: interaction.user.id,
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
        await interaction.reply({ content: `Your wallet address is: \`${account.address}\`` })
    }

}

// ** Wallet Settings ** //

const settings = async (interaction) => {

    let user = await User.findOne({ discordId: interaction.user.id });

    const embed = [
        {
            "type": "rich",
            "title": `Your Wallet Settings`,
            "description": "",
            "color": 0x00FFFF,
            "fields": [
                {
                    "name": `Slippage`,
                    "value": `\`${user.defaultSlippage}%\``,
                    "inline": true
                },
                {
                    "name": `Max Fee Per Gas`,
                    "value": `\`${user.maxFeePerGas} GWEI\``
                },
                {
                    "name": `Max Priority Fee Per Gas`,
                    "value": `\`${user.maxPriorityFeePerGas} GWEI\``
                },
                {
                    "name": `Gas Limit`,
                    "value": `\`${user.gasLimit} WEI\``
                },
                {
                    "name": `Buy Delta`,
                    "value": `\`${user.buyDelta} GWEI\``
                },
                {
                    "name": `Sell Delta`,
                    "value": `\`${user.sellDelta} GWEI\``
                }
            ]
        }
    ]

    const changeSettings = new ButtonBuilder()
        .setCustomId('changesettings')
        .setLabel('Change Settings')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
        .addComponents(changeSettings);

    interaction.reply({ embeds: embed, components: [row] })

}

const changeSettings = async (interaction) => {

    const settingsModal = new ModalBuilder()
        .setCustomId('settingsModal')
        .setTitle('Update your wallet settings here');

    const maxFeePerGasInput = new TextInputBuilder()
        .setCustomId('maxFeePerGasInput')
        .setLabel("Max Fee Per Gas")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const maxPriorityFeePerGasInput = new TextInputBuilder()
        .setCustomId('maxPriorityFeePerGasInput')
        .setLabel("Max Priority Fee Per Gas")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const gasLimitInput = new TextInputBuilder()
        .setCustomId('gasLimitInput')
        .setLabel("Gas Limit")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const buyDeltaInput = new TextInputBuilder()
        .setCustomId('buyDeltaInput')
        .setLabel("Buy Delta")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const sellDeltaInput = new TextInputBuilder()
        .setCustomId('sellDeltaInput')
        .setLabel("Sell Delta")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const firstActionRow = new ActionRowBuilder().addComponents(maxFeePerGasInput);
    const secondActionRow = new ActionRowBuilder().addComponents(maxPriorityFeePerGasInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(gasLimitInput);
    const fourthActionRow = new ActionRowBuilder().addComponents(buyDeltaInput);
    const fifthActionRow = new ActionRowBuilder().addComponents(sellDeltaInput);


    // Add inputs to the modal
    settingsModal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);
    await interaction.showModal(settingsModal);

}

const updateSettings = async (interaction) => {

    console.log('test')

    const maxFeePerGasInput = interaction.fields.getTextInputValue('maxFeePerGasInput');
    const maxPriorityFeePerGasInput = interaction.fields.getTextInputValue('maxPriorityFeePerGasInput');
    const gasLimitInput = interaction.fields.getTextInputValue('gasLimitInput');
    const buyDeltaInput = interaction.fields.getTextInputValue('buyDeltaInput');
    const sellDeltaInput = interaction.fields.getTextInputValue('sellDeltaInput');

    let user = await User.findOne({ discordId: interaction.user.id });

    if (maxFeePerGasInput) { user.maxFeePerGas = maxFeePerGasInput }
    if (maxPriorityFeePerGasInput) { user.maxPriorityFeePerGas = maxPriorityFeePerGasInput }
    if (gasLimitInput) { user.gasLimit = gasLimitInput }
    if (buyDeltaInput) { user.buyDelta = buyDeltaInput }
    if (sellDeltaInput) { user.sellDelta = sellDeltaInput }

    await user.save()

    await interaction.reply('Settings updated')

}

const exportPrivateKey = async (interaction) => {

    const user = await User.findOne({ discordId: interaction.user.id });

    if (!user.walletAddress) {
        interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
        return;
    }

    const password = interaction.options.getString('password')

    try {
        walletSecret = (await web3.eth.accounts.decrypt(user.encryptedPrivateKey, password)).privateKey
        interaction.reply(`Private Key: \`${walletSecret}\``)
        return;
    } catch {
        interaction.reply('Incorrect password.')
        return;
    }

}

module.exports = { purchase, setup, passwordSubmit, settings, changeSettings, updateSettings, exportPrivateKey };