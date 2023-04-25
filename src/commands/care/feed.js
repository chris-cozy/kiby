const { Client, Interaction, EmbedBuilder } = require('discord.js');
const userStats = require('../../schemas/stats');
const userDates = require('../../schemas/dates');
const getGif = require('../../utils/getGif');
const calculateXpForLevel = require('../../utils/calculateXpForLevel');

/**
 * @brief Calculate a random number between the bounds
 * @param {Number} min 
 * @param {Number} max 
 * @return A number between the bounds
 */
function randon_num(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
        await interaction.deferReply({ ephemeral: true });

        let userKirby = await userStats.findOne({ userId: interaction.user.id });
        let userDate = await userDates.findOne({ userId: interaction.user.id });

        const minutes = 30;
        const milliConversion = 60000;
        const currentDate = new Date();
        const max = 100;
        const gifUrl = await getGif('feed');


        // Check if user owns a kirby
        if (userKirby) {
            try {
                // Check if it has been minimum time since last feed
                if ((currentDate - userDate.lastFeed) < (minutes * milliConversion)) {
                    interaction.editReply(`You can only feed ${userKirby.kirbyName} every ${minutes} minutes!`);
                    return;
                }

                // Generate feed and xp amount
                let feedGranted = randon_num(10, 30);
                const xpGranted = randon_num(5, 15);

                if ((userKirby.hunger + feedGranted) > max) {
                    feedGranted = max - userKirby.hunger;
                }

                const embed = new EmbedBuilder()
                    .setTitle(userKirby.kirbyName)
                    .setColor('Random')
                    .setDescription(`**${interaction.user.username}'s** has fed **${userKirby.kirbyName}**!`)
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
                    .setImage(gifUrl)
                    .setThumbnail(client.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: `requested by ${interaction.user.tag} `, iconURL: `${interaction.user.displayAvatarURL()}` });

                // Update feed and xp in db
                userDate.lastFeed = currentDate;

                userKirby.xp += xpGranted;
                // If user's xp exceeds that for current level
                if (userKirby.xp > calculateXpForLevel(userKirby.level)) {
                    userKirby.xp = 0;
                    userKirby.level += 1;

                    interaction.editReply({ content: `**${userKirby.kirbyName}** has leveled up to level **${userKirby.level}**!` });
                }

                // Save database updates
                await userKirby.save().catch((e) => {
                    console.log(`There was an error saving.`);
                });

                await userDate.save().catch((e) => {
                    console.log(`There was an error saving.`);
                });


                // Send embed
                interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.log(`there was an error: ${error}`);
            }

        } else {
            interaction.editReply(`You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey.`);
            return;
        }
    },
}