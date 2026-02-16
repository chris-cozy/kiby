const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const leaderboardService = require("../../services/leaderboardService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "leaderboard",
  description: "View the top Kibys.",
  deleted: false,

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: false });

    const board = await leaderboardService.getMixedLeaderboard(10);
    const command = new CommandContext();

    let description = "";
    board.top.forEach((entry, index) => {
      const label = `${index + 1}. ${entry.kirbyName} | Lv.${entry.level} | XP ${entry.xp}`;
      const highlighted = entry.type === "player" && entry.userId === interaction.user.id;
      description += highlighted ? `**${label}**\n` : `${label}\n`;
    });

    if (!description) {
      description = "No Kibys on the board yet.";
    }

    const embed = new EmbedBuilder()
      .setTitle(`Leaderboard (${board.total} total)`)
      .setColor(command.pink)
      .setDescription(description)
      .setFooter({
        text: `Requested by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await safeReply(interaction, { embeds: [embed] });
  },
};
