const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const playerService = require("../../services/playerService");
const leaderboardService = require("../../services/leaderboardService");
const sleepService = require("../../services/sleepService");
const { calculateXpForLevel } = require("../../domain/progression/calculateXpForLevel");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "info",
  description: "View your Kiby's stats.",
  deleted: false,

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: false });

    const player = await playerService.getPlayerByUserId(interaction.user.id);
    if (!player) {
      await safeReply(interaction, {
        content: "You do not have a Kiby yet. Use `/adopt` to get started.",
        ephemeral: true,
      });
      return;
    }

    const [leaderboard, schedule] = await Promise.all([
      leaderboardService.getMixedLeaderboard(200),
      sleepService.getScheduleForUser(interaction.user.id),
    ]);

    const rankIndex = leaderboard.rows.findIndex(
      (row) => row.type === "player" && row.userId === interaction.user.id
    );
    const rank = rankIndex >= 0 ? rankIndex + 1 : leaderboard.total;

    const command = new CommandContext();
    const media = await command.get_media_attachment("portrait");
    const sleepSummary = sleepService.getSleepSummary(schedule, new Date());

    const embed = new EmbedBuilder()
      .setTitle(player.kirbyName)
      .setColor(command.pink)
      .addFields(
        {
          name: "Level",
          value: `${player.level}`,
          inline: true,
        },
        {
          name: "XP",
          value: `${player.xp}/${calculateXpForLevel(player.level)}`,
          inline: true,
        },
        {
          name: "Global Rank",
          value: `${rank}/${leaderboard.total}`,
          inline: true,
        },
        {
          name: "HP",
          value: `${player.hp}/100`,
          inline: true,
        },
        {
          name: "Hunger",
          value: `${player.hunger}/100`,
          inline: true,
        },
        {
          name: "Affection",
          value: `${player.affection}/100`,
          inline: true,
        },
        {
          name: "Sleep Schedule",
          value: `${sleepSummary.timezone} ${sleepSummary.startLocalTime} (${sleepSummary.durationHours}h)`,
          inline: false,
        }
      )
      .setImage(media.mediaString)
      .setFooter({
        text: `Adopted ${player.adoptedAt.toLocaleDateString("en-US")}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      files: [media.mediaAttach],
    });
  },
};
