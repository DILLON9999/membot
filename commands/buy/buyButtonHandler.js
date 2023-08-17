const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { User } = require('../../database/model');
const { ethers } = require('ethers');
const Web3 = require('web3').default;
const web3 = new Web3(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);

// Trade functions
const { swapBuy } = require('../trades/buy')

// Transaction data
const erc20Abi = require('../trades/abi.json')
const ethersProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);
const UNISWAP_ROUTER_ADDRESS = "0x81d69a8dc9364cfb8273b1b55f9d4715ec782fd9"

const buyModal = require('./Components/buyModal')
const buyEmbed = require('./Components/buyEmbed');
const successEmbed = require('./Components/successEmbed');

module.exports = async (interaction) => {
    
    try {

        let user = await User.findOne({ discordId: interaction.user.id })
        let buttonId = interaction.customId.split(':')
        /* module:button:userId */

        let defaultValue;
        switch (buttonId[1]) {
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

        // Show purchase confirmation modal
        await interaction.showModal(await buyModal(defaultValue));
        const collectorFilter = i => i.user.id === interaction.user.id;
        const submitConfirmation = await interaction.awaitModalSubmit({ filter: collectorFilter, time: 1200000 });

        // Modal inputs
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

        // Store start tokens held
        const tokenData = await buyEmbed(buttonId[3])
        const tokenContract = await new ethers.Contract(tokenData.saveData.address, erc20Abi, ethersProvider)
        const startTokenAmount = ethers.utils.formatUnits(await tokenContract.balanceOf(user.walletAddress), tokenData.saveData.decimals)

        // Send transaction
        await submitConfirmation.reply({ content: `Sending purchase for: \`${ethAmount} ETH\``, components: [] });
        const txRes = await swapBuy(tokenData.saveData, ethAmount, user, walletSecret)

        // Return and send error if transaction not placed
        if (txRes.resp == 'error') {
            await submitConfirmation.editReply({ content: `Error: ${txRes.reason}`, embeds: [] });
            return;
        }

        // Show tx hash
        await submitConfirmation.editReply({ content: `Transaction Sent: [${txRes.hash}](https://etherscan.io/tx/${txRes.hash})`, embeds: [] });

        // Wait for promise to finish and check end tokens
        await txRes.promise
        const endTokenAmount = ethers.utils.formatUnits(await tokenContract.balanceOf(user.walletAddress), tokenData.saveData.decimals)
        txRes.recieved = endTokenAmount - startTokenAmount

        // Show successful embed message
        await submitConfirmation.editReply({ content: '', embeds: await successEmbed(txRes, tokenData.saveData.symbol, 'ETH') });

        // Max approve token for later swaps
        const ethersSigner = new ethers.Wallet(walletSecret, ethersProvider);
        const approvalContract = new ethers.Contract(tokenData.saveData.address, erc20Abi, ethersSigner);
        const approvalTransaction = await approvalContract.approve(UNISWAP_ROUTER_ADDRESS, ethers.constants.MaxUint256);
        await approvalTransaction.wait();

        // Add held token to users database
        let addToken = true
        for (let i = 0; i < user.tokens.length; i++) {
            if (user.tokens[i].address == contract) { addToken = false }
        }
        if (addToken) { user.tokens.push(tokenData.saveData); await user.save() }

    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
    }
}