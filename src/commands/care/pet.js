const { Client, Interaction, EmbedBuilder } = require('discord.js');
const userStats = require('../../schemas/stats');
const userDates = require('../../schemas/dates');
const calculateXpForLevel = require('../../utils/calculateXpForLevel');
const randomNumber = require("../../utils/randomNumber");
const command = require('../../classes/command');

module.exports = {
    name: 'pet',
    description: 'Pet your Kirby!',
    devonly: false,
    testOnly: false,
    deleted: false,

    /**
     * @brief Pet user's kirby
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const pet = new command(5);
        let media = await pet.get_media_attachment('play');

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

                const awakeDate = new Date(userDate.lastSleep.getTime() + pet.sleepTime);
                // If Kirby is still asleep, alter image
                if (pet.currentDate < awakeDate) {
                    media = await pet.get_media_attachment('sleep');
                }


                // Check if it has been minimum time since last affection
                if ((pet.currentDate - userDate.lastPet) < (pet.interactionCooldown)) {
                    interaction.editReply({ content: `You can only pet ${userKirby.kirbyName} every ${pet.cooldownMins} minutes! They need personal space too!`, ephemeral: true });
                    return;
                }

                // Generate affection and xp amount
                let affectionGranted = randomNumber(2, 7);
                const xpGranted = randomNumber(5, 15);

                if ((userKirby.affection + affectionGranted) > pet.max) {
                    affectionGranted = pet.max - userKirby.affection;
                }

                const embed = new EmbedBuilder()
                    .setTitle('**PETTING**')
                    .setColor(pet.pink)
                    .setDescription(`**${interaction.user.username}** is petting **${userKirby.kirbyName}**!`)
                    .addFields(
                        {
                            name: 'Health',
                            value: `${userKirby.hp}`,
                            inline: true
                        },
                        {
                            name: 'Affection',
                            value: `${userKirby.affection} -> ${userKirby.affection + affectionGranted}`,
                            inline: true
                        }
                    )
                    .setImage(media.mediaString)
                    .setTimestamp()
                    .setFooter({ text: `${client.user.tag} `, iconURL: `${client.user.displayAvatarURL()}` });

                // Update feed and xp in db
                userDate.lastPet = pet.currentDate;
                userKirby.affection += affectionGranted;

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