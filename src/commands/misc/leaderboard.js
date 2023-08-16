const { Client, Interaction, EmbedBuilder } = require("discord.js");
const userStats = require("../../schemas/stats");
const command = require("../../classes/command");

module.exports = {
  name: "leaderboard",
  description: "Kiby Leaderboard!",
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

    try {
      const leaderboard = new command();
      const allUsers = await userStats.find();

      // Sort all users by level and xp
      allUsers.sort((a, b) => {
        if (a.level === b.level) {
          return b.xp - a.xp;
        } else {
          return b.level - a.level;
        }
      });

      // Limit length to top ten users
      const length = Math.min(allUsers.length, 10);

      // Find the length of the longest kiby name
      const longestNameLength = allUsers.reduce(
        (max, user) => Math.max(max, user.kirbyName.length),
        0
      );

      // Construct the leaderboard variable
      let topten = "";
      for (let i = 0; i < length; i++) {
        const user = await client.users.fetch(allUsers[i].userId);
        const levelSpacing = " ".repeat(
          longestNameLength - allUsers[i].kirbyName.length + 2
        );
        const userLine = `${i + 1}. ${
          allUsers[i].kirbyName
        }${levelSpacing}Level: ${allUsers[i].level}\n`;

        if (interaction.user.id === user.id) {
          topten += `**${userLine}**`;
        } else {
          topten += userLine;
        }
      }

      const embed = create_leaderboard_embed(
        client,
        allUsers,
        interaction,
        topten
      );
      interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error in leaderboard.js: ${error}`);
    }
  },
};

function create_leaderboard_embed(client, allUsers, interaction, topten) {
  return new EmbedBuilder()
    .setAuthor({
      name: `${client.user.username}`,
      iconURL: `${client.user.displayAvatarURL()}`,
      url: "https://discord.js.org",
    })
    .setTitle(`Kiby's Elite Ten (${allUsers.length} Kibys)`)
    .setColor(leaderboard.pink)
    .setDescription(topten)
    .setURL("https://discord.js.org/#/")
    .setTimestamp()
    .setFooter({
      text: `Requested by ${interaction.user.username}`,
      iconURL: `${interaction.user.displayAvatarURL()}`,
    });
}
