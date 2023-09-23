const { Client, EmbedBuilder } = require("discord.js");
const userStats = require("../../schemas/stats");
const command = require("../../classes/command");

/**
 * @brief Send user a notification that the kirby needs attention
 * @param {Client} client
 * @param {userStats} userStats
 * @return N/A
 */
module.exports = async (client, userStats) => {
  const affectionNotification = new command();
  const media = await affectionNotification.get_media_attachment("affection");

  try {
    const user = await client.users.fetch(userStats.userId);
    if (!user) {
      console.error(`User not found for ID: ${userStats.userId}`);
      return;
    }
    const dmChannel = await user.createDM();
    const embed = new EmbedBuilder()
      .setTitle("**AFFECTION**")
      .setColor(affectionNotification.pink)
      .setDescription(`**${userStats.kirbyName}** wants affection!`)
      .setImage(media.mediaString)
      .setTimestamp()
      .setFooter({
        text: `${client.user.username} `,
        iconURL: `${client.user.displayAvatarURL()}`,
      });

    dmChannel
      .send({ embeds: [embed], files: [media.mediaAttach] })
      .then(() => {
        console.log(
          `Affection notification successfully sent to ${user.username}`
        );
      })
      .catch((error) => {
        console.error(
          "Error sending attention notification:",
          error.rawError.message
        );
      });
  } catch (error) {
    console.error(
      "Error sending affection notification:",
      error.rawError.message
    );
  }
};
