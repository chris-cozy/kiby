const { Client, EmbedBuilder } = require("discord.js");
const userStats = require("../../schemas/stats");
const command = require("../../classes/command");

/**
 * @brief Send user a notification that the kirby is hungry
 * @param {Client} client
 * @param {userStats} userStats
 * @return N/A
 */
module.exports = async (client, userStats) => {
  const hungerNotification = new command();
  const media = await hungerNotification.get_media_attachment("hungry");

  try {
    const user = await client.users.fetch(userStats.userId);
    if (!user) {
      console.error(`User not found for ID: ${userStats.userId}`);
      return;
    }
    const dmChannel = await user.createDM();
    const embed = new EmbedBuilder()
      .setTitle("**HUNGRY**")
      .setColor(hungerNotification.pink)
      .setDescription(`**${userStats.kirbyName}** is hungry!`)
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
          `Hunger notification successfully sent to ${user.username}`
        );
      })
      .catch((error) => {
        console.error(
          "Error sending hunger notification:",
          error.rawError.message
        );
      });
  } catch (error) {
    console.error("Error sending death notification:", error.rawError.message);
  }
};
