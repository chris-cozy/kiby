const { Client, Interaction, EmbedBuilder } = require('discord.js');
const userStats = require('../../schemas/stats');
const calculateXpForLevel = require('../../utils/calculateXpForLevel');

module.exports = {
    name: 'info',
    description: 'Information about your Kirby!',
    devonly: false,
    testOnly: false,
    deleted: false,

    /**
     * @brief Send an embed with bot information
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: false });

        let userKirby = await userStats.findOne({ userId: interaction.user.id });

        // If user has a kirby
        if (userKirby) {
            let allUsers = await userStats.find().select('-_id userId level xp');

            // Sort all users by level and xp
            allUsers.sort((a, b) => {
                if (a.level === b.level) {
                    return b.xp - a.xp;
                } else {
                    return b.level - a.level;
                }
            });

            // Grab rank of desired user
            let currentRank = allUsers.findIndex((lvl) => lvl.userId === userKirby.userId) + 1;


            try {
                const embed = new EmbedBuilder()
                    .setTitle(userKirby.kirbyName)
                    .setColor('Random')
                    .setDescription(`**${interaction.user.username}'s** Kirby pet!`)
                    .setURL('https://discord.js.org/#/')
                    .addFields(
                        {
                            name: 'Level',
                            value: `**${userKirby.level}**`,
                            inline: true
                        },
                        {
                            name: 'Xp',
                            value: `**${userKirby.xp}**/${Math.round(calculateXpForLevel(userKirby.level))}`,
                            inline: true
                        },
                        {
                            name: 'Global Rank',
                            value: `**${currentRank}**/${allUsers.length}`,
                            inline: true
                        },
                    )
                    .addFields(
                        {
                            name: 'Health',
                            value: `**${userKirby.hp}**/100`,
                            inline: true
                        },
                        {
                            name: 'Hunger',
                            value: `**${userKirby.hunger}**/100`,
                            inline: true
                        },
                        {
                            name: 'Affection',
                            value: `**${userKirby.affection}**/100`,
                            inline: true
                        },
                        {
                            name: 'Adopt Date',
                            value: `${userKirby.adoptDate.toLocaleDateString('en-us', { year: "numeric", month: "short", day: "numeric" })}`,
                            inline: false
                        }
                    )
                    .setThumbnail(client.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL()}` });

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