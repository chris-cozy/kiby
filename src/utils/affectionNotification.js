const { Client, EmbedBuilder } = require('discord.js');
const userStats = require('../schemas/stats');
const command = require('../classes/command');

/**
 * @brief Send user a notification that the kirby needs attention
 * @param {Client} client
 * @param {userStats} userStats
 * @return N/A
 */
module.exports = async (client, userStats) => {
    const affectionNotification = new command();
    const media = await affectionNotification.get_media_attachment('affection');
    const user = client.users.cache.get(userStats.userId);

    if (user) {
        const embed = new EmbedBuilder()
            .setTitle('**AFFECTION**')
            .setColor(affectionNotification.pink)
            .setDescription(`**${userStats.kirbyName}** wants affection!`)
            .setImage(media.mediaString)
            .setTimestamp()
            .setFooter({ text: `${client.user.tag} `, iconURL: `${client.user.displayAvatarURL()}` });

        user.send(embed)
            .then(() => {
                console.log('DM with embed sent successfully!');
            })
            .catch((error) => {
                console.error('Error sending DM with embed:', error);
            });
    } else {
        console.error('User not found!');
    }



}