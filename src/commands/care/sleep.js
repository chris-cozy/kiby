const { Client, Interaction, EmbedBuilder } = require("discord.js");
const userStats = require('../../schemas/stats');
const userDates = require('../../schemas/dates');
const command = require('../../classes/command');
const convert_countdown = require('../../utils/convertCountdown');

module.exports = {
    name: 'sleep',
    description: 'Put your Kirby to sleep for 9 hours!',
    devonly: false,
    testOnly: false,
    deleted: false,

    /**
     * @brief Put the Kirby to sleep for 8 hours
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const sleep = new command(540);
        const media = await sleep.get_media_attachment('sleep');

        const deferOptions = { ephemeral: !interaction.inGuild() };
        await interaction.deferReply(deferOptions);

        try {
            let userKirby = await userStats.findOne({ userId: interaction.user.id });
            let userDate = await userDates.findOne({ userId: interaction.user.id });

            // If user doesn't exist, show an error message
            if (!userKirby) {
                interaction.editReply(
                    "You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey."
                );
                return;
            }

            // Check if user has already slept today
            if (userDate.lastSleep.toDateString() === sleep.currentDate.toDateString()) {
                interaction.editReply({
                    content: `**${userKirby.kirbyName}** cannot sleep again until tomorrow!`,
                    ephemeral: true,
                });
                return;
            }

            // Change sleep date
            userDate.lastSleep = sleep.currentDate;


            const embed = new EmbedBuilder()
                .setTitle('**SLEEPING**')
                .setColor(sleep.pink)
                .setDescription(`**${userKirby.kirbyName}** is sleeping for ${convert_countdown(sleep.interactionCooldown)}!`)
                .setImage(media.mediaString)
                .setTimestamp()
                .setFooter({ text: `${client.user.tag} `, iconURL: `${client.user.displayAvatarURL()}` });

            // Update database
            await userDate.save().catch((e) => {
                console.log(`There was an error saving: ${e}`);
            });

            interaction.editReply({ embeds: [embed], files: [media.mediaAttach] });
        } catch (error) {
            console.log(`There was an error: $${error}`);
        }
    },
}