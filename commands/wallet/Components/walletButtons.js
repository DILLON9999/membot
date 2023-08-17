const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = async (interaction, user) => {

    const withdrawButton = new ButtonBuilder()
        .setCustomId(`wallet:withdraw:${interaction.user.id}`)
        .setLabel('Withdraw')
        .setStyle(ButtonStyle.Secondary);

    const linkButton = new ButtonBuilder()
        .setLabel('Etherscan')
        .setURL(`https://etherscan.io/address/${user.walletAddress}`)
        .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder()
        .addComponents(withdrawButton, linkButton);

    return row

}