const { ethers } = require('ethers');
const holdingEmbed = require('./Components/holdingEmbed');
const holdingButtons = require('./Components/holdingButtons')

// Transaction data
const erc20Abi = require('../trades/abi.json');
const ethersProvider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/d25074e260984463be075e88db795106`);

const holdingUI = async (interaction, tokens, index, userWallet) => {

    // Get amount of token currently held
    const tokenContract = await new ethers.Contract(tokens[index].address, erc20Abi, ethersProvider)
    const tokensHeld = ethers.utils.formatUnits(await tokenContract.balanceOf(userWallet), tokens[index].decimals)
    const walletBalance = Number(ethers.utils.formatUnits(await ethersProvider.getBalance(userWallet), 18)).toFixed(4)

    // Create message embed
    const dataEmbed = await holdingEmbed(tokens[index].address, Number(tokensHeld).toFixed(4), walletBalance)

    // Send data with wallet buttons
    const holdingResponse = await interaction.editReply({
        embeds: [dataEmbed.embed],
        components: await holdingButtons(interaction, tokens, index)
    })

    // Functionality for scrolling buttons
    const collectorFilter = (i) => { return i.user.id === interaction.user.id && i.customId.startsWith('scroll'); };
    try {
        const holdingChoice = await holdingResponse.awaitMessageComponent({ filter: collectorFilter, time: 1200000});

        let buttonId = holdingChoice.customId.split(':')
        switch (buttonId[1]) {
            case 'prev':
                holdingChoice.deferUpdate()
                return await holdingUI(interaction, tokens, index - 1, userWallet)
            case 'next':
                holdingChoice.deferUpdate()
                return await holdingUI(interaction, tokens, index + 1, userWallet)
        }
    } catch (e) {
        if (!e.code == 'InteractionCollectorError') {
            console.log(e)
        }
        // await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        return
    }
}

module.exports = { holdingUI }