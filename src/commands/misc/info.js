const { Client, Interaction, EmbedBuilder } = require("discord.js");
const userStats = require("../../schemas/stats");
const calculate_xp_for_level = require("../../utils/calculateXpForLevel");
const command = require("../../classes/command");

module.exports = {
  name: "info",
  description: "Information about your Kirby!",
  devonly: false,
  testOnly: false,
  deleted: false,

  /**
   * @brief Send an embed with bot information
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: false });
    const info = new command();
    const media = await info.get_media_attachment();

    try {
      const userKirby = await userStats.findOne({
        userId: interaction.user.id,
      });
      if (!userKirby) {
        interaction.editReply(
          "You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey."
        );
        return;
      }

      const allUsers = await userStats.find().select("-_id userId level xp");

      // Sort all users by level and xp
      allUsers.sort((a, b) => {
        if (a.level === b.level) {
          return b.xp - a.xp;
        } else {
          return b.level - a.level;
        }
      });

      // Grab rank of desired user
      let currentRank =
        allUsers.findIndex((lvl) => lvl.userId === userKirby.userId) + 1;

      const embed = create_info_embed(
        client,
        userKirby,
        currentRank,
        allUsers,
        media.mediaString,
        info,
        interaction
      );
      interaction.editReply({
        embeds: [embed],
        files: [media.mediaAttach],
      });
    } catch (error) {
      console.error(`Error in info.js: ${error}`);
    }
  },
};

function create_info_embed(
  client,
  userKirby,
  currentRank,
  allUsers,
  mediaString,
  info,
  interaction
) {
  const div = "---------------------------";
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${client.user.username}`,
      iconURL: `${client.user.displayAvatarURL()}`,
      url: "https://discord.js.org",
    })
    .setTitle(userKirby.kirbyName)
    .setColor(info.pink)
    .setDescription(`${div}${info.zeroSpace}`)
    .setURL("https://discord.js.org/#/")
    .addFields(
      {
        name: "Level",
        value: `**${userKirby.level}**`,
        inline: true,
      },
      {
        name: "Xp",
        value: `**${userKirby.xp}**/${Math.round(
          calculate_xp_for_level(userKirby.level)
        )}`,
        inline: true,
      },
      {
        name: "Global Rank",
        value: `**${currentRank}**/${allUsers.length}`,
        inline: true,
      }
    )
    .addFields(
      {
        name: "Health",
        value: `**${userKirby.hp}**/100`,
        inline: true,
      },
      {
        name: "Hunger",
        value: `**${userKirby.hunger}**/100`,
        inline: true,
      },
      {
        name: "Affection",
        value: `**${userKirby.affection}**/100`,
        inline: true,
      }
    )
    .setThumbnail(mediaString)
    .setTimestamp()
    .setFooter({
      text: `Adopted ${userKirby.adoptDate.toLocaleDateString("en-us", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}`,
      iconURL: `${interaction.user.displayAvatarURL()}`,
    });
  return embed;
}
