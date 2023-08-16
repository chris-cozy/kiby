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
    if (user) {
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
          console.log("DM with embed sent successfully!");
        })
        .catch((error) => {
          console.error("Error sending DM with embed:", error);
        });
    } else {
      console.error("User not found!");
    }
  } catch (error) {
    console.error("Error sending hunger notification:", error);
  }
};
