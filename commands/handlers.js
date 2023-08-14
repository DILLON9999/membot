const axios = require('axios');
const { User } = require('../database/model');
const { ethers } = require('ethers');

const { client } = require('../install')
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const erc20Abi = require('./trades/abi.json')
const ethersProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);

// Helper functions
const { tokenData } = require('./components/embeds/tokenData')
const { webhook } = require('./components/embeds/webhook')
const { heldTokenData } = require('./components/embeds/heldTokenData');
const { swapResponse } = require('./components/embeds/swapResponse')
const { settingsEmbed } = require('./components/embeds/settingsEmbed')

// Command components
const { ethButtons } = require('./components/buttons/ethButtons')
const { holdingButtons } = require('./components/buttons/holdingButtons');
const { purchaseModal } = require('./components/modals/purchaseModal')
const { sellModal } = require('./components/modals/sellModal')
const { withdrawModal } = require('./components/modals/withdrawModal')
const { settingsModal } = require('./components/modals/settingsModal')

// Trade functions
const { sell } = require('./trades/sell')
const { buy } = require('./trades/buy')


const bcrypt = require('bcrypt');
const saltRounds = 10;

const Web3 = require('web3').default;
const infuraApiKey = 'd25074e260984463be075e88db795106';
const web3 = new Web3(`https://mainnet.infura.io/v3/${infuraApiKey}`);

// ** Buy and Sell ** //

const purchase = async (interaction, contract) => {

    try {

        const user = await User.findOne({ discordId: interaction.user.id });

        // Check if user has wallet
        if (!user) {
            interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
            return;
        }

        // Send message embed from given contract
        const dataEmbed = await tokenData(contract)

        // Send data with purchase buttons
        const amountResponse = await interaction.reply({
            embeds: dataEmbed.embed,
            components: [await ethButtons()]
        })

        const collectorFilter = i => i.user.id === interaction.user.id;

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
        await submitConfirmation.reply({ content: `Sending purchase for ${ethAmount} ETH`, components: [] });
        const txRes = await buy(dataEmbed.saveData, ethAmount, user, walletSecret)

        // Return and send error if transaction not placed
        if (txRes.resp == 'error') {
            await submitConfirmation.followUp({ content: `Error: ${txRes.reason}`, embeds: [] });
            return;
        }

        // Show successful embed message
        await submitConfirmation.followUp({ content: '', embeds: await swapResponse(txRes, dataEmbed.saveData.symbol, 'ETH') });

        // Send successful swap webhook
        await webhook(txRes, dataEmbed.saveData.symbol, 'ETH')

        // Add held token to users database
        let addToken = true
        for (let i = 0; i < user.tokens.length; i++) {
            if (user.tokens[i].address == contract) { addToken = false }
        }
        if (addToken) { user.tokens.push(dataEmbed.saveData); await user.save() }

        return

    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
        // await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        return
    }
}

const holdingUi = async (interaction, tokens, index, userWallet) => {

    // Get amount of token currently held
    const tokenContract = await new ethers.Contract(tokens[index].address, erc20Abi, ethersProvider)
    const tokensHeld = ethers.utils.formatUnits(await tokenContract.balanceOf(userWallet), tokens[index].decimals)
    const walletBalance = Number(ethers.utils.formatUnits(await ethersProvider.getBalance(userWallet), 18)).toFixed(4)

    const dataEmbed = await heldTokenData(tokens[index].address, Number(tokensHeld).toFixed(4), walletBalance)

    // Send data with purchase buttons
    const holdingResponse = await interaction.editReply({
        embeds: [dataEmbed.embed],
        components: await holdingButtons(tokens, index)
    })

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {

        const holdingChoice = await holdingResponse.awaitMessageComponent({ filter: collectorFilter });

        // Get password from popup modal if sell is selected
        let password;
        let tokenAmount;
        let withdrawWallet;

        // Pop up the sell modal
        if (holdingChoice.customId !== 'prev' && holdingChoice.customId !== 'next' && holdingChoice.customId !== 'withdraw') {
            await holdingChoice.showModal(await sellModal());
            await holdingChoice.awaitModalSubmit({ filter: collectorFilter, time: 120_000 })
                .then(async (sellPasswordModal) => { // sellPasswordModal is correctly passed here.
                    password = await sellPasswordModal.fields.getTextInputValue('sellPassword');
                    sellPasswordModal.deferUpdate()
                })
                .catch(err => console.log(err));

            // Pop up the withdraw modal
        } else if (holdingChoice.customId == 'withdraw') {
            await holdingChoice.showModal(await withdrawModal());
            await holdingChoice.awaitModalSubmit({ filter: collectorFilter, time: 120_000 })
                .then(async (withdrawTokenModal) => {
                    password = await withdrawTokenModal.fields.getTextInputValue('withdrawPassword');
                    tokenAmount = await withdrawTokenModal.fields.getTextInputValue('ethInput');
                    withdrawWallet = await withdrawTokenModal.fields.getTextInputValue('withdrawWallet')
                    withdrawTokenModal.deferUpdate()
                })
                .catch(err => console.log(err));
        }

        switch (holdingChoice.customId) {
            case 'prev':
                holdingChoice.deferUpdate()
                return await holdingUi(interaction, tokens, index - 1, userWallet)
            case 'next':
                holdingChoice.deferUpdate()
                return await holdingUi(interaction, tokens, index + 1, userWallet)
            case 'sellQuarter':
                return { "call": "sell", "percent": 0.25, "token": tokens[index], "password": password }
            case 'sellHalf':
                return { "call": "sell", "percent": 0.5, "token": tokens[index], "password": password }
            case 'sellThreeQuarters':
                return { "call": "sell", "percent": 0.75, "token": tokens[index], "password": password }
            case 'sellFull':
                return { "call": "sell", "percent": 1, "token": tokens[index], "password": password }
            case 'withdraw':
                return { "call": "withdraw", "token": tokens[index], "amount": tokenAmount, "withdrawWallet": withdrawWallet, "password": password }
        }

    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        return
    }
}

const holding = async (interaction) => {

    try {
        const user = await User.findOne({ discordId: interaction.user.id });

        if (!user) {
            interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
            return;
        }

        if (!user.tokens || user.tokens.length == 0) {
            await interaction.reply("You are not currently holding or tracking any tokens")
            return
        }

        // Set reply to edit later
        await interaction.reply("Checking Tokens...")

        // Initialize UI at the first index of held tokens
        const chosenToken = await holdingUi(interaction, user.tokens, 0, user.walletAddress)

        // Clear buttons at bottom
        await interaction.editReply({ components: [] });

        // Decrypt wallet
        let walletSecret;
        try {
            walletSecret = (await web3.eth.accounts.decrypt(user.encryptedPrivateKey, chosenToken.password)).privateKey
        } catch {
            await interaction.editReply({ content: 'Incorrect password', embeds: [], components: [] });
            return;
        }

        // Send tokens to other wallet if withdraw called
        if (chosenToken.call == 'withdraw') {
            try {
                const wallet = new ethers.Wallet(walletSecret, ethersProvider)
                const contract = new ethers.Contract(chosenToken.token.address, erc20Abi, wallet);
                const howMuchTokens = ethers.utils.parseUnits(chosenToken.amount, chosenToken.token.decimals)
                await contract.transfer(chosenToken.withdrawWallet, howMuchTokens)
                await interaction.editReply({ content: `Withdrawn to: ${chosenToken.withdrawWallet}` });
                return
            } catch (e) {
                console.log(e)
                await interaction.editReply({ content: `Error: Error sending withdraw`, embeds: [] });
                return
            }
        }

        const txRes = await sell(chosenToken.token, chosenToken.percent, user, walletSecret)
        if (txRes.resp == 'error') {
            await interaction.editReply({ content: `Error: ${txRes.reason}` });
            return;
        }

        await interaction.editReply({ content: '', embeds: await swapResponse(txRes, 'ETH', chosenToken.token.symbol) });
        await webhook(txRes, 'ETH', chosenToken.token.symbol)

    } catch (e) {
        console.log(e)
        return
    }

}

// ** Create Account ** // 

const setup = async (interaction) => {

    // Build setup modal
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

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {
        await interaction.showModal(setupModal);
        const submit = await interaction.awaitModalSubmit({ filter: collectorFilter, time: 120_000 });

        // get password from modal
        const password = submit.fields.getTextInputValue('passwordInput');

        //Generate a new account
        const account = await web3.eth.accounts.create();

        // Encrypt private key and password
        const encryptedPrivateKey = await web3.eth.accounts.encrypt(account.privateKey, password);
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        let user = await User.findOne({ discordId: interaction.user.id });
        if (user) {
            await submit.reply({ content: `You have already created a wallet` })
        } else {
            user = new User({
                discordId: interaction.user.id,
                username: interaction.user.username,
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
            await submit.reply({ content: `Your wallet address is: \`${account.address}\`` })
        }

    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        return
    }
}

// ** Wallet Settings ** //

const settings = async (interaction) => {

    let user = await User.findOne({ discordId: interaction.user.id });
    if (!user) {
        interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
        return;
    }

    const changeSettings = new ButtonBuilder()
        .setCustomId('changesettings')
        .setLabel('Change Settings')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
        .addComponents(changeSettings);

    const resp = await interaction.reply({ embeds: await settingsEmbed(user), components: [row] })

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {
        const confirmation = await resp.awaitMessageComponent({ filter: collectorFilter, time: 60000 });
        // Wait for modal to be submitted
        await confirmation.showModal(await settingsModal());
        const submitConfirmation = await confirmation.awaitModalSubmit({ filter: collectorFilter, time: 120_000 });

        // Modal inputs
        const slippageInput = submitConfirmation.fields.getTextInputValue('slippageInput');
        const maxGasInput = submitConfirmation.fields.getTextInputValue('maxGasInput');
        const gasLimitInput = submitConfirmation.fields.getTextInputValue('gasLimitInput');
        const buyDeltaInput = submitConfirmation.fields.getTextInputValue('buyDeltaInput');
        const sellDeltaInput = submitConfirmation.fields.getTextInputValue('sellDeltaInput');

        if (slippageInput) { user.defaultSlippage = slippageInput }
        if (maxGasInput) { user.maxGas = maxGasInput }
        if (gasLimitInput) { user.gasLimit = gasLimitInput }
        if (buyDeltaInput) { user.buyDelta = buyDeltaInput }
        if (sellDeltaInput) { user.sellDelta = sellDeltaInput }

        await user.save()

        await submitConfirmation.update({ content: `Settings Updated`, embeds: [], components: [] })

        return
    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        return
    }
}

const exportPrivateKey = async (interaction) => {

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

const getWallet = async (interaction) => {

    const user = await User.findOne({ discordId: interaction.user.id });

    if (!user) {
        interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
        return;
    }

    const walletEmbed = [
        {
            "type": "rich",
            "title": "",
            "description": "",
            "color": 0x00FFFF,
            "fields": [
                {
                    "name": `Wallet Address`,
                    "value": `\`${user.walletAddress}\``
                },
                {
                    "name": `Balance`,
                    "value": `\`${Number(ethers.utils.formatUnits(await ethersProvider.getBalance(user.walletAddress), 18)).toFixed(4)} ETH\``
                }
            ]
        }
    ]

    const withdrawButton = new ButtonBuilder()
        .setCustomId('withdraw')
        .setLabel('Withdraw')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
        .addComponents(withdrawButton);

    const resp = await interaction.reply({ embeds: walletEmbed, components: [row] })

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {
        const confirmation = await resp.awaitMessageComponent({ filter: collectorFilter, time: 60000 });
        // Wait for modal to be submitted
        await confirmation.showModal(await withdrawModal());
        const submitConfirmation = await confirmation.awaitModalSubmit({ filter: collectorFilter, time: 120_000 });
        // Modal inputs
        const ethInput = submitConfirmation.fields.getTextInputValue('ethInput');
        const withdrawWallet = submitConfirmation.fields.getTextInputValue('withdrawWallet')
        const withdrawPassword = submitConfirmation.fields.getTextInputValue('withdrawPassword')
        await submitConfirmation.update({ content: `Withdrawing...`, embeds: [], components: [] });

        // Decrypt wallet
        let walletSecret;
        try {
            walletSecret = (await web3.eth.accounts.decrypt(user.encryptedPrivateKey, withdrawPassword)).privateKey
        } catch {
            submitConfirmation.editReply({ content: 'Incorrect password', components: [] });
            return;
        }

        // Send a transaction
        const wallet = new ethers.Wallet(walletSecret, ethersProvider)
        const txArgs = {
            to: withdrawWallet,
            value: ethers.utils.parseEther(ethInput)
        }

        // Handle transaction resp
        try {
            const txRes = await wallet.sendTransaction(txArgs)
            await submitConfirmation.editReply({ content: `${ethInput} ETH Withdraw: [${txRes.hash}](https://etherscan.io/tx/${txRes.hash}) `, embeds: [], components: [] });
        } catch (e) {
            await submitConfirmation.editReply({ content: 'Error placing transaction', embeds: [], components: [] });
            return;
        }

    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        return
    }


}

module.exports = { purchase, setup, holding, settings, exportPrivateKey, getWallet };