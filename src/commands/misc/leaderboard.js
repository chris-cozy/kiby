const { Client, Interaction, EmbedBuilder } = require('discord.js');
const userStats = require('../../schemas/stats');
const command = require('../../classes/command');

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

        const leaderboard = new command();

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
        const userCount = allUsers.length;
        let length = userCount;
        if (length > 10) {
            length = 10;
        }

        // Construct the leaderboard variable
        let topten = '';
        for (let i = 0; i < length; i++) {
            let user = await client.users.fetch(allUsers[i].userId)
            topten += `${i + 1}.   **${allUsers[i].kirbyName}**(${user.discriminator})        Level: ${allUsers[i].level}\n`
        }

        try {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `${client.user.username}`, iconURL: `${client.user.displayAvatarURL()}`, url: 'https://discord.js.org' })
                .setTitle(`Kiby Leaderboard (${userCount} Kibys)`)
                .setColor(leaderboard.pink)
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