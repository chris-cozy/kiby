const { Client, EmbedBuilder } = require("discord.js");
const userStats = require("../../schemas/stats");
const command = require("../../classes/command");

/**
 * @brief Send user a notification that the kirby has died
 * @param {Client} client
 * @param {userStats} userStats
 * @return N/A
 */
module.exports = async (client, userStats) => {
  const deathNotification = new command();
  const media = await deathNotification.get_media_attachment("death");

  try {
    const user = await client.users.fetch(userStats.userId);
    if (!user) {
      console.error(`User not found for ID: ${userStats.userId}`);
      return;
    }

    const dmChannel = await user.createDM();
    const embed = new EmbedBuilder()
      .setTitle("**DEATH**")
      .setColor(deathNotification.pink)
      .setDescription(
        `**${userStats.kirbyName}** has died! They were left neglected for too long! They left one final message "I still love you.."`
      )
      .setImage(media.mediaString)
      .setTimestamp()
      .setFooter({
        text: `${client.user.username} `,
        iconURL: `${client.user.displayAvatarURL()}`,
      });

    dmChannel
      .send({ embeds: [embed], files: [media.mediaAttach] })
      .then(() => {
        console.log(`Death notification successfully sent to ${user.username}`);
      })
      .catch((error) => {
        console.error(
          "Error sending death notification:",
          error.rawError.message
        );
      });
  } catch (error) {
    console.error("Error sending death notification:", error.rawError.message);
  }
};
