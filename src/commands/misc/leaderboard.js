const { Client, Interaction, EmbedBuilder } = require('discord.js');
const userStats = require('../../schemas/stats');
const calculateXpForLevel = require('../../utils/calculateXpForLevel');
const { bold, italic, strikethrough, underscore, spoiler, quote, blockQuote } = require('discord.js');

module.exports = {
    name: 'leaderboard',
    description: 'Kiby Leaderboard!',
    devonly: false,
    testOnly: false,
    deleted: false,

    /**
     * @brief Send an embed with bot leaderboard
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: false });

        const pink = '#FF69B4'

        // Sort all users by level and xp
        let allUsers = await userStats.find();
        allUsers.sort((a, b) => {
            if (a.level === b.level) {
                return b.xp - a.xp;
            } else {
                return b.level - a.level;
            }
        });

        // Limit length to top ten users
        let length = allUsers.length;
        if (length > 10) {
            length = 10;
        }

        // Construct the leaderboard variable
        let topten = '';
        for (let i = 0; i < length; i++) {
            let user = await client.users.fetch(allUsers[i].userId)
            topten += `${i + 1}.   **${allUsers[i].kirbyName}**(${user.username})        Level: ${allUsers[i].level}\n`
        }

        try {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `${client.user.username}`, iconURL: `${client.user.displayAvatarURL()}`, url: 'https://discord.js.org' })
                .setTitle('Kiby Leaderboard')
                .setColor(pink)
                .setDescription(topten)
                .setURL('https://discord.js.org/#/')
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL()}` });

            interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.log(`There was an error: ${error}`);
        }
    },
}