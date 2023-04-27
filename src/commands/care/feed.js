const { Client, Interaction, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const userStats = require('../../schemas/stats');
const userDates = require('../../schemas/dates');
const calculateXpForLevel = require('../../utils/calculateXpForLevel');
const getMedia = require('../../utils/getMedia');
const randomNumber = require("../../utils/randomNumber");


module.exports = {
    name: 'feed',
    description: 'Feed your Kirby!',
    devonly: false,
    testOnly: false,
    deleted: false,

    /**
     * @brief Feed's user's kirby
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {

        if (interaction.inGuild()) {
            await interaction.deferReply({ ephemeral: true });
        } else {
            await interaction.deferReply({ ephemeral: false });
        }


        let userKirby = await userStats.findOne({ userId: interaction.user.id });
        let userDate = await userDates.findOne({ userId: interaction.user.id });

        const minutes = 30;
        const milliConversion = 60000;
        const currentDate = new Date();
        const max = 100;

        // Attaching media file
        const mediaFile = await getMedia('feed');
        const mediaAttach = new AttachmentBuilder(mediaFile.url);


        // Check if user owns a kirby
        if (userKirby) {
            try {

                // Check if kirby is hungry
                if (userKirby.hunger == max) {
                    interaction.editReply(`**${userKirby.kirbyName}** is not hungry!`);
                    return;
                }

                // Check if it has been minimum time since last feed
                if ((currentDate - userDate.lastFeed) < (minutes * milliConversion)) {
                    interaction.editReply(`You can only feed ${userKirby.kirbyName} every ${minutes} minutes!`);
                    return;
                }

                // Generate feed and xp amount
                let feedGranted = randomNumber(10, 30);
                const xpGranted = randomNumber(5, 15);

                if ((userKirby.hunger + feedGranted) > max) {
                    feedGranted = max - userKirby.hunger;
                }

                const embed = new EmbedBuilder()
                    .setTitle('**FEEDING**')
                    .setColor('Random')
                    .setDescription(`**${interaction.user.username}** has fed **${userKirby.kirbyName}**!`)
                    .addFields(
                        {
                            name: 'Health',
                            value: `${userKirby.hp}`,
                            inline: true
                        },
                        {
                            name: 'Hunger',
                            value: `${userKirby.hunger} -> ${userKirby.hunger + feedGranted}`,
                            inline: true
                        }
                    )
                    .setImage('attachment://' + mediaFile.name)
                    .setTimestamp()
                    .setFooter({ text: `${client.user.tag} `, iconURL: `${client.user.displayAvatarURL()}` });

                // Update feed and xp in db
                userDate.lastFeed = currentDate;
                userKirby.hunger += feedGranted;

                userKirby.xp += xpGranted;
                // If user's xp exceeds that for current level
                if (userKirby.xp > calculateXpForLevel(userKirby.level)) {
                    userKirby.xp = 0;
                    userKirby.level += 1;

                    interaction.editReply({ content: `**${userKirby.kirbyName}** has leveled up to level **${userKirby.level}**!` });
                }

                // Save database updates
                await userKirby.save().catch((e) => {
                    console.log(`There was an error saving: ${e}`);
                });

                await userDate.save().catch((e) => {
                    console.log(`There was an error saving: ${e}`);
                });

                interaction.editReply({ embeds: [embed], files: [mediaAttach] });
            } catch (error) {
                console.log(`there was an error: ${error}`);
            }
        } else {
            interaction.editReply(`You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey.`);
            return;
        }
    },
}