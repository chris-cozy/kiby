const { Client, Interaction, EmbedBuilder } = require('discord.js');
const userStats = require('../../schemas/stats');

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
        await interaction.deferReply({ ephemeral: true });

        let userKirby = await userStats.findOne({ userId: interaction.user.id });

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
                            value: `${userKirby.level}`,
                            inline: true
                        },
                        {
                            name: 'Xp',
                            value: `${userKirby.xp}`,
                            inline: true
                        },
                        {
                            name: 'Global Rank',
                            value: `${currentRank}/${allUsers.length}`,
                            inline: true
                        },
                    )
                    .addFields(
                        {
                            name: 'Health',
                            value: `${userKirby.hp}`,
                            inline: true
                        },
                        {
                            name: 'Hunger',
                            value: `${userKirby.hunger}`,
                            inline: true
                        },
                        {
                            name: 'Affection',
                            value: `${userKirby.affection}`,
                            inline: true
                        },
                        {
                            name: 'Adopt Date',
                            value: `${userKirby.adoptDate}`,
                            inline: false
                        }
                    )
                    .setThumbnail(client.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: `requested by ${interaction.user.tag} `, iconURL: `${interaction.user.displayAvatarURL()}` });

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