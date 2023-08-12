const axios = require('axios');
const { User } = require('../database/model');
const { buy } = require('./trades/buy')
const { ethers } = require('ethers');
const { sell } = require('./trades/sell')
const { client } = require('../install')
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const erc20Abi = require('./trades/abi.json')
const ethersProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);

// Helper functions
const { tokenData } = require('./helpers/tokenData')
const { webhook } = require('./helpers/webhook')
const { heldTokenData } = require('./helpers/heldTokenData');

// Command components
const { ethButtons } = require('./components/ethButtons')
const { holdingButtons } = require('./components/holdingButtons');
const { purchaseModal } = require('./components/purchaseModal')
const { sellModal } = require('./components/sellModal')

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
        embeds: dataEmbed.embed,
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
        const txRes = await buy(contract, user.walletAddress, user.defaultSlippage, ethAmount, user.maxFeePerGas, user.maxPriorityFeePerGas, user.gasLimit, user.buyDelta, walletSecret, dataEmbed.saveData.decimals)

        // Return and send error if transaction not placed
        if (txRes == 'error') {
            submitConfirmation.editReply("Error placing transaction")
            return;
        }

        await submitConfirmation.editReply(`Trade placed: ${txRes}`);
        // await submitConfirmation.editReply({ content: `Trade Placed`, embeds: [] });

        // Send successful swap webhook
        await webhook(dataEmbed.saveData.name, dataEmbed.saveData.symbol, ethAmount, txRes)

        // Add held token to users database
        let addToken = true
        for (let i = 0; i < user.tokens.length; i++) {
            if (user.tokens[i].address == contract) { addToken = false }
        }
        if (addToken) { user.tokens.push(dataEmbed.saveData); await user.save() }

        return

    } catch (e) {
        console.log(e)
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        return
    }
}

const holdingUi = async (interaction, tokens, index, userWallet) => {

    // Get amount of token currently held
    const tokenContract = await new ethers.Contract(tokens[index].address, erc20Abi, ethersProvider)
    const tokensHeld = ethers.utils.formatUnits(await tokenContract.balanceOf(userWallet), tokens[index].decimals)

    const dataEmbed = await heldTokenData(tokens[index].address, Number(tokensHeld).toFixed(4))

    // Send data with purchase buttons
    const holdingResponse = await interaction.editReply({
        embeds: dataEmbed.embed,
        components: await holdingButtons(tokens, index)
    })

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {

        const holdingChoice = await holdingResponse.awaitMessageComponent({ filter: collectorFilter });
 
        switch (holdingChoice.customId) {
            case 'prev':
                return await holdingUi(interaction, tokens, index - 1, userWallet)
            case 'next':
                return await holdingUi(interaction, tokens, index + 1, userWallet)
            case 'sellQuarter':
                return { "percent": 0.25, "token": tokens[index] }
            case 'sellHalf':
                return { "percent": 0.5, "token": tokens[index] }
            case 'sellThreeQuarters':
                return { "percent": 0.75, "token": tokens[index] }
            case 'sellFull':
                return { "percent": 1, "token": tokens[index] }
        }        

    } catch (e) {
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        return
    }
}

const holding = async (interaction) => {

    const user = await User.findOne({ discordId: interaction.user.id });

    if (!user.tokens || user.tokens.length == 0) {
        await interaction.reply("You are not currently holding or tracking any tokens")
        return
    }

    // Set reply to edit later
    await interaction.reply("Checking Tokens...")

    // Initialize UI at the first index of held tokens
    const chosenToken = await holdingUi(interaction, user.tokens, 0, user.walletAddress)
    console.log(chosenToken)

    // Clear buttons at bottom
    await interaction.editReply({ components: [] });

    // Decrypt wallet
    let walletSecret;
    const password = interaction.options.getString('password');
    try {
        walletSecret = (await web3.eth.accounts.decrypt(user.encryptedPrivateKey, password)).privateKey
    } catch {
        interaction.editReply({ content: 'Incorrect password', components: [] });
        return;
    }

    const txRes = await sell(chosenToken.token, user.walletAddress, user.defaultSlippage, chosenToken.percent, user.maxFeePerGas, user.maxPriorityFeePerGas, user.gasLimit, user.buyDelta, walletSecret)
    if (txRes == 'error') {
        interaction.editReply("Error placing transaction")
        return;
    }

    await interaction.editReply(`Trade placed: ${txRes}`);

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

module.exports = { purchase, setup, holding, passwordSubmit, settings, changeSettings, updateSettings, exportPrivateKey };