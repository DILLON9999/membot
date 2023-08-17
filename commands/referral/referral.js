const { User } = require('../../database/model');
const referralEmbed = require('./Components/referralEmbed')

module.exports = async (interaction) => {

    // Check if user exists in db
    const user = await User.findOne({ discordId: interaction.user.id });
    if (!user) {
        interaction.reply('You haven\'t made a wallet yet. Use /setup to create one.');
        return;
    }

    // Use referral code
    if (interaction.options.getString('use')) {

        const username = interaction.options.getString('use')

        // check if user has already used a code
        if (user.hasUsedReferral) {
            interaction.reply('You have already used a referral code.');
            return;
        }

        // check if code exists
        const referralUser = await User.findOne({ username: username });
        if (!referralUser) {
            interaction.reply('Referral code not found.');
            return;
        }

        // check if it's the users referral code
        if (username == interaction.user.username) {
            interaction.reply('bruh you cant use your own referral code lol');
            return;
        }

        // add referral code and save that user has used it
        referralUser.referralUses += 1
        await referralUser.save()
        user.hasUsedReferral = true
        await user.save()
        interaction.reply('Referral code used.');
        return;
    }

    // Setup account for referrals
    if (!user.referralUses) {
        user.username = interaction.user.username
        user.referralUses = 0
        await user.save()
    }

    await interaction.reply({ embeds: await referralEmbed(user) })
    return
} 