const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { User } = require('../../database/model');
const { ethers } = require('ethers');
const Web3 = require('web3').default;
const web3 = new Web3(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);
const buyEmbed = require('../buy/Components/buyEmbed');
const successEmbed = require('../buy/Components/successEmbed');

const withdrawModal = require('./Components/withdrawModal');

// Trade functions
const { swapSell } = require('../trades/sell')

// Transaction data
const erc20Abi = require('../trades/abi.json');
const holdingModal = require('./Components/holdingModal');
const ethersProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);
const UNISWAP_ROUTER_ADDRESS = "0x81d69a8dc9364cfb8273b1b55f9d4715ec782fd9"

module.exports = async (interaction) => {

    try {

        let user = await User.findOne({ discordId: interaction.user.id })
        let buttonId = interaction.customId.split(':')
        /* module:button:userId */

        // Get token data
        const tokenData = await buyEmbed(buttonId[3])

        // Withdraw Button
        if (buttonId[1] == 'withdraw') {

            // Send withdraw modal
            await interaction.showModal(await withdrawModal())
            const collectorFilter = i => i.user.id === interaction.user.id;
            const submitConfirmation = await interaction.awaitModalSubmit({ filter: collectorFilter, time: 1200000 });

            // Withdraw modal fields
            const password = await submitConfirmation.fields.getTextInputValue('withdrawPassword');
            const tokenAmount = await submitConfirmation.fields.getTextInputValue('ethInput');
            const withdrawWallet = await submitConfirmation.fields.getTextInputValue('withdrawWallet')

            // Decrypt wallet
            let walletSecret;
            try {
                walletSecret = (await web3.eth.accounts.decrypt(user.encryptedPrivateKey, password)).privateKey
            } catch {
                await submitConfirmation.editReply({ content: 'Incorrect password', embeds: [], components: [] });
                return;
            }

            // Try to make withdraw to other wallet
            try {
                const wallet = new ethers.Wallet(walletSecret, ethersProvider)
                const contract = new ethers.Contract(buttonId[3], erc20Abi, wallet); // Call with address stored in buttonId
                const howMuchTokens = ethers.utils.parseUnits(tokenAmount, tokenData.saveData.decimals)
                await contract.transfer(withdrawWallet, howMuchTokens)
                await submitConfirmation.reply({ content: `Withdrawn to: ${chosenToken.withdrawWallet}` });
                return
            } catch (e) {
                console.log(e)
                await submitConfirmation.reply({ content: `Error: Error sending withdraw`, embeds: [] });
                return
            }
        }

        // Show sell confirmation modal
        await interaction.showModal(await holdingModal());
        const collectorFilter = i => i.user.id === interaction.user.id;
        const submitConfirmation = await interaction.awaitModalSubmit({ filter: collectorFilter, time: 1200000 });
        const password = await submitConfirmation.fields.getTextInputValue('sellPassword');

        // Decrypt wallet
        let walletSecret;
        try {
            walletSecret = (await web3.eth.accounts.decrypt(user.encryptedPrivateKey, password)).privateKey
        } catch {
            await submitConfirmation.reply({ content: 'Incorrect password', embeds: [], components: [] });
            return;
        }

        // Get percent of token to sell
        let percent;
        switch (buttonId[1]) {
            case 'sellQuarter':
                percent = 0.25;
                break;
            case 'sellHalf':
                percent = 0.5;
                break;
            case 'sellThreeQuarters':
                percent = 0.75;
                break;
            case 'sellFull':
                percent = 1;
                break;
        }

        // Send transaction
        await submitConfirmation.reply({ content: `Sending swap for: \`${percent * 100}%\``, embeds: [], components: [] });
        const txRes = await swapSell(tokenData.saveData, percent, user, walletSecret)

        // Return and send error if transaction not placed
        if (txRes.resp == 'error') {
            await submitConfirmation.editReply({ content: `Error: ${txRes.reason}` });
            return;
        }

        // Show hash sent
        await submitConfirmation.editReply({ content: `Transaction Sent: [${txRes.hash}](https://etherscan.io/tx/${txRes.hash})`, embeds: [] });

        // Wait for promise to finish and send success embed
        await txRes.promise.wait()
        await submitConfirmation.editReply({ content: '', embeds: await successEmbed(txRes, 'ETH', chosenToken.token.symbol) });

    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
        return
    }
}