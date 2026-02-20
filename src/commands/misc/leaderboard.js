const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const leaderboardService = require("../../services/leaderboardService");
const env = require("../../config/env");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "leaderboard",
  description: "View the top Kibys.",
  deleted: false,
  options: [
    {
      name: "mode",
      description: "Leaderboard mode",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: "Total", value: "total" },
        { name: "Season", value: "season" },
        { name: "All Players (Restricted)", value: "players" },
      ],
    },
    {
      name: "count",
      description: "Number of entries",
      type: ApplicationCommandOptionType.Integer,
      required: false,
      choices: [
        { name: "5", value: 5 },
        { name: "10", value: 10 },
        { name: "15", value: 15 },
        { name: "20", value: 20 },
      ],
    },
  ],

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: false });

    const mode = interaction.options.getString("mode") || "total";
    const count = interaction.options.getInteger("count") || 10;
    if (mode === "players" && !env.devUserIds.includes(interaction.user.id)) {
      await safeReply(interaction, {
        content: "Players-only leaderboard mode is restricted to developers.",
        ephemeral: true,
      });
      return;
    }

    const board = await leaderboardService.getLeaderboard(
      {
        mode,
        limit: count,
      },
      new Date()
    );
    const command = new CommandContext();

    let description = "";
    board.top.forEach((entry, index) => {
      const titleTag = entry.titleLabel ? ` [${entry.titleLabel}]` : "";
      const rankPrefix =
        index === 0 ? "🥇 " : index === 1 ? "🥈 " : index === 2 ? "🥉 " : "";
      const label = `${rankPrefix}${index + 1}. ${entry.kirbyName}${titleTag} -- Lv.${entry.level} -- XP ${entry.xp}`;
      const highlighted = entry.type === "player" && entry.userId === interaction.user.id;
      description += highlighted ? `**${label}**\n` : `${label}\n`;
    });

    if (!description) {
      description = "No Kibys on the board yet.";
    }

    const embed = new EmbedBuilder()
      .setTitle(
        board.mode === "season"
          ? `Season Leaderboard (${board.total} total)`
          : board.mode === "players"
          ? `Players Leaderboard (${board.total} total)`
          : `Total Leaderboard (${board.total} total)`
      )
      .setColor(command.pink)
      .setDescription(description)
      .setFooter({
        text: `Requested by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    if (board.mode === "season") {
      embed.addFields({
        name: "Season",
        value: `${board.seasonKey}\nEnds: ${new Date(board.seasonEndsAt).toLocaleString(
          "en-US"
        )}`,
        inline: false,
      });
    }

    await safeReply(interaction, { embeds: [embed] });
  },
};
