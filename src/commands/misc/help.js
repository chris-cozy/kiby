const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "help",
  description: "Learn how to use Kiby.",
  deleted: false,

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });
    const command = new CommandContext();

    const embed = new EmbedBuilder()
      .setTitle("Kiby Help")
      .setColor(command.pink)
      .setDescription("Core commands for caring for your Kiby.")
      .addFields(
        {
          name: "Adopt",
          value: "`/adopt name:<name>`",
        },
        {
          name: "Care",
          value: "`/feed`, `/pet`, `/play`, `/cuddle`, `/train`, `/bathe`, `/revive`",
        },
        {
          name: "Sleep",
          value: "`/sleep schedule set/view/clear`, `/ambient`",
        },
        {
          name: "Stats",
          value: "`/info`, `/cooldowns`, `/leaderboard`",
        },
        {
          name: "Shop",
          value: "`/shop buy`, `/shop list`, `/inventory`, `/use`, `/gift`",
        },
        {
          name: "Quests",
          value: "`/daily`, `/quests view`, `/quests claim`, `/quests reroll`, `/titles`",
        },
        {
          name: "Social & Events",
          value: "`/social`, `/events`, `/adventure`",
        }
      )
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await safeReply(interaction, { embeds: [embed], ephemeral: true });
  },
};
