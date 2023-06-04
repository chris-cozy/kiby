const { Client, Interaction, EmbedBuilder } = require('discord.js');
const userStats = require('../../schemas/stats');
const userDates = require('../../schemas/dates');
const calculateXpForLevel = require('../../utils/calculateXpForLevel');
const randomNumber = require("../../utils/randomNumber");
const command = require('../../classes/command');


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
        const feed = new command(10);
        const media = await feed.get_media_attachment('feed');

        if (interaction.inGuild()) {
            await interaction.deferReply({ ephemeral: true });
        } else {
            await interaction.deferReply({ ephemeral: false });
        }

        let userKirby = await userStats.findOne({ userId: interaction.user.id });
        let userDate = await userDates.findOne({ userId: interaction.user.id });


        // Check if user owns a kirby
        if (userKirby) {
            try {

                const awakeDate = new Date(userDate.lastSleep.getTime() + feed.sleepTime);
                // If Kirby is still asleep, still the care check
                if (feed.currentDate < awakeDate) {
                    interaction.editReply(`You can't feed ${userKirby.kirbyName} while they're asleep!`);
                    return;
                }

                // Check if kirby is hungry
                if (userKirby.hunger == feed.max) {
                    interaction.editReply({ content: `**${userKirby.kirbyName}** is too full!`, ephemeral: true });
                    return;
                }

                // Check if it has been minimum time since last feed
                if ((feed.currentDate - userDate.lastFeed) < (feed.interactionCooldown)) {
                    interaction.editReply({ content: `You can only feed ${userKirby.kirbyName} every ${feed.cooldownMins} minutes!`, ephemeral: true });
                    return;
                }

                // Generate feed and xp amount
                let feedGranted = randomNumber(5, 10);
                const xpGranted = randomNumber(5, 15);

                if ((userKirby.hunger + feedGranted) > feed.max) {
                    feedGranted = feed.max - userKirby.hunger;
                }

                const embed = new EmbedBuilder()
                    .setTitle('**FEEDING**')
                    .setColor(feed.pink)
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
                    .setImage(media.mediaString)
                    .setTimestamp()
                    .setFooter({ text: `${client.user.tag} `, iconURL: `${client.user.displayAvatarURL()}` });

                // Update feed and xp in db
                userDate.lastFeed = feed.currentDate;
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

                interaction.editReply({ embeds: [embed], files: [media.mediaAttach] });
            } catch (error) {
                console.log(`there was an error: ${error}`);
            }
        } else {
            interaction.editReply(`You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey.`);
            return;
        }
    },
}