const { Client, Interaction, EmbedBuilder } = require("discord.js");
const userStats = require('../../schemas/stats');
const userDates = require('../../schemas/dates');
const command = require('../../classes/command');

module.exports = {
    name: 'sleep',
    description: 'Put your Kirby to sleep!',
    devonly: false,
    testOnly: false,
    deleted: false,

    /**
     * @brief Put the Kirby to sleep for 8 hours
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const sleep = new command(480);
        const media = await sleep.get_media_attachment('sleep');
        const awakeDate = new Date(sleep.currentDate.getTime() + (sleep.interactionCooldown));

        await interaction.deferReply({ ephemeral: true });

        try {
            let userKirby = await userStats.findOne({ userId: interaction.user.id });
            let userDate = await userDates.findOne({ userId: interaction.user.id });

            // If user exists, grab dates and check relevance, then update collect date. 
            if (userDate) {
                // Check if user has slept today
                if (userDate.lastSleep.toDateString() === sleep.currentDate.toDateString()) {
                    interaction.editReply({ content: `**${userKirby.kirbyName}** cannot sleep again until tomorrow!` });
                    return;
                }

                // Change sleep date
                userDate.lastSleep = sleep.currentDate;

                const embed = new EmbedBuilder()
                    .setTitle('**SLEEPING**')
                    .setColor(sleep.pink)
                    .setDescription(`**${userKirby.kirbyName}** is sleeping until ${awakeDate.toLocaleString()}!`)
                    .setImage(media.mediaString)
                    .setTimestamp()
                    .setFooter({ text: `${client.user.tag} `, iconURL: `${client.user.displayAvatarURL()}` });

                // Update database
                await userDate.save().catch((e) => {
                    console.log(`There was an error saving: ${e}`);
                });

                interaction.editReply({ embeds: [embed], files: [media.mediaAttach] });
            } else {
                interaction.editReply(`You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey.`);
                return;
            }
        } catch (error) {
            console.log(`There was an error: $${error}`);
        }
    },
}