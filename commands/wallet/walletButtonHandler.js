const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { User } = require('../../database/model');
const { ethers } = require('ethers');
const Web3 = require('web3').default;
const web3 = new Web3(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);

const withdrawModal = require('../holding/Components/withdrawModal');

// Transaction data
const ethersProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);

module.exports = async (interaction) => {

    try {

        let user = await User.findOne({ discordId: interaction.user.id })
        let buttonId = interaction.customId.split(':')
        /* module:button:userId */

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
                await submitConfirmation.reply({ content: 'Incorrect password', embeds: [], components: [] });
                return;
            }

            // Try to make withdraw to other wallet
            try {
                const wallet = new ethers.Wallet(walletSecret, ethersProvider)
                const txArgs = {
                    to: withdrawWallet,
                    value: ethers.utils.parseEther(tokenAmount)
                }
                const txRes = await wallet.sendTransaction(txArgs)
                await submitConfirmation.reply({ content: `${tokenAmount} ETH Withdraw: [${txRes.hash}](https://etherscan.io/tx/${txRes.hash}) `, embeds: [], components: [] });
                return
            } catch (e) {
                console.log(e)
                await submitConfirmation.reply({ content: 'Error placing withdraw transaction', embeds: [], components: [] });
                return;
            }
        }
    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
        return
    }
}