const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const playerService = require("../../services/playerService");
const sleepService = require("../../services/sleepService");
const onboardingService = require("../../services/onboardingService");
const { getActionCooldownMs } = require("../../domain/care/rules");
const convertCountdown = require("../../utils/convertCountdown");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

function getActionRemainingMs(nowMs, lastActionAt, cooldownMs) {
  if (!lastActionAt) {
    return 0;
  }

  const elapsed = nowMs - new Date(lastActionAt).getTime();
  if (elapsed >= cooldownMs) {
    return 0;
  }

  return cooldownMs - elapsed;
}

module.exports = {
  name: "cooldowns",
  description: "View interaction cooldowns for your Kiby.",
  deleted: false,

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });

    const player = await playerService.getPlayerByUserId(interaction.user.id);
    if (!player) {
      await safeReply(interaction, {
        content: "You do not have a Kiby yet. Use `/adopt` first.",
        ephemeral: true,
      });
      return;
    }

    const schedule = await sleepService.getScheduleForUser(interaction.user.id);
    const summary = sleepService.getSleepSummary(schedule, new Date());
    const nowMs = Date.now();

    const cooldownEntries = [
      {
        name: "Pet",
        remainingMs: getActionRemainingMs(
          nowMs,
          player.lastCare.pet,
          getActionCooldownMs("pet")
        ),
      },
      {
        name: "Feed",
        remainingMs: getActionRemainingMs(
          nowMs,
          player.lastCare.feed,
          getActionCooldownMs("feed")
        ),
      },
      {
        name: "Play",
        remainingMs: getActionRemainingMs(
          nowMs,
          player.lastCare.play,
          getActionCooldownMs("play")
        ),
      },
      {
        name: "Cuddle",
        remainingMs: getActionRemainingMs(
          nowMs,
          player.lastCare.cuddle,
          getActionCooldownMs("cuddle")
        ),
      },
      {
        name: "Train",
        remainingMs: getActionRemainingMs(
          nowMs,
          player.lastCare.train,
          getActionCooldownMs("train")
        ),
      },
      {
        name: "Bathe",
        remainingMs: getActionRemainingMs(
          nowMs,
          player.lastCare.bathe,
          getActionCooldownMs("bathe")
        ),
      },
    ]
      .filter((entry) => entry.remainingMs > 0)
      .sort((a, b) => a.remainingMs - b.remainingMs);

    const command = new CommandContext();
    const description = cooldownEntries.length
      ? `Active cooldown timers for **${player.kirbyName}**.`
      : summary.sleeping
        ? `No active cooldown timers for **${player.kirbyName}**. While asleep, only \`/pet\` and \`/cuddle\` are available.`
        : `No active cooldown timers for **${player.kirbyName}**. All care actions are ready.`;

    const fields = [
      {
        name: "Sleep Status",
        value: summary.sleeping
          ? `ASLEEP (${convertCountdown(summary.remainingMs)} left)`
          : "AWAKE",
        inline: false,
      },
    ];

    if (cooldownEntries.length) {
      fields.push(
        ...cooldownEntries.map((entry) => ({
          name: entry.name,
          value: convertCountdown(entry.remainingMs),
          inline: true,
        }))
      );
    }

    const embed = new EmbedBuilder()
      .setTitle("Cooldowns")
      .setColor(command.pink)
      .setDescription(description)
      .addFields(...fields)
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
    try {
      await onboardingService.recordEvent(
        interaction.user.id,
        "cooldowns-view",
        {},
        new Date()
      );
    } catch {
      // Ignore onboarding tracking failures.
    }
  },
};
