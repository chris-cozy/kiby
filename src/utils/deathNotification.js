const { Client, EmbedBuilder } = require('discord.js');
const userStats = require('../schemas/stats');
const command = require('../classes/command');

/**
 * @brief Send user a notification that the kirby has died
 * @param {Client} client
 * @param {userStats} userStats
 * @return N/A
 */
module.exports = async (client, userStats) => {
    const deathNotification = new command();
    const media = await deathNotification.get_media_attachment('death');
    const user = await client.users.fetch(userStats.userId);

    if (user && user.dmChannel) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('**DEATH**')
                .setColor(deathNotification.pink)
                .setDescription(`**${userStats.kirbyName}** has died! They were left neglected for too long! They left one final message "I still love you.."`)
                .setImage(media.mediaString)
                .setTimestamp()
                .setFooter({ text: `${client.user.tag} `, iconURL: `${client.user.displayAvatarURL()}` });

            user.send({ embeds: [embed], files: [media.mediaAttach] })
                .then(() => {
                    console.log('DM with embed sent successfully!');
                })
                .catch((error) => {
                    console.error('Error sending DM with embed:', error);
                });
        } catch (error) {
            console.log('User has disabled direct messages:', user.userId);
        }
    } else {
        console.error('User not found!');
    }
}