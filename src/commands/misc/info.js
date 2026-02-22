const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const playerService = require("../../services/playerService");
const leaderboardService = require("../../services/leaderboardService");
const sleepService = require("../../services/sleepService");
const { calculateXpForLevel } = require("../../domain/progression/calculateXpForLevel");
const { evaluateMood } = require("../../domain/mood/evaluateMood");
const titleService = require("../../services/titleService");
const onboardingService = require("../../services/onboardingService");
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

    const [leaderboard, schedule, titleState] = await Promise.all([
      leaderboardService.getMixedLeaderboard(200),
      sleepService.getScheduleForUser(interaction.user.id),
      titleService.ensureTitlesForUser(interaction.user.id),
    ]);

    const rankIndex = leaderboard.rows.findIndex(
      (row) => row.type === "player" && row.userId === interaction.user.id
    );
    const rank = rankIndex >= 0 ? rankIndex + 1 : leaderboard.total;

    const command = new CommandContext();
    const media = await command.get_media_attachment("info");
    const sleepSummary = sleepService.getSleepSummary(schedule, new Date());
    const mood = evaluateMood(player, { sleeping: sleepSummary.sleeping });
    const activeTitle = titleState.equipped
      ? titleState.catalog.find((title) => title.id === titleState.equipped)?.label
      : "";

    const embed = new EmbedBuilder()
      .setTitle(player.kirbyName)
      .setColor(command.pink)
      .addFields(
        {
          name: `Level ${player.level}`,
          value: `${player.xp}/${calculateXpForLevel(player.level)} XP`,
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
          name: "Social",
          value: `${player.social}/100`,
          inline: true,
        },
        {
          name: "Battle Power",
          value: `${player.battlePower || 0}`,
          inline: true,
        },
        {
          name: "Mood",
          value: mood,
          inline: true,
        },
        {
          name: "Sleep Status",
          value: sleepSummary.sleeping ? "ASLEEP" : "AWAKE",
          inline: true,
        },
        {
          name: "Title",
          value: activeTitle || "None equipped",
          inline: true,
        },
        {
          name: "Sleep Schedule",
          value: `${sleepSummary.timezone} ${sleepSummary.startLocalTime} (${sleepSummary.durationHours}h)`,
          inline: false,
        },
        {
          name: "Adopted At",
          value: player.adoptedAt.toLocaleDateString("en-US"),
          inline: true,
        }
      )
      .setImage(media.mediaString)
      .setFooter({
        text: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      files: [media.mediaAttach],
    });
    try {
      await onboardingService.recordEvent(
        interaction.user.id,
        "info-view",
        {},
        new Date()
      );
    } catch {
      // Ignore onboarding tracking failures.
    }
  },
};
