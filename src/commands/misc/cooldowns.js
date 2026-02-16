const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const playerService = require("../../services/playerService");
const sleepService = require("../../services/sleepService");
const { getActionCooldownMs } = require("../../domain/care/rules");
const convertCountdown = require("../../utils/convertCountdown");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

function getActionAvailability(nowMs, lastActionAt, cooldownMs) {
  if (!lastActionAt) {
    return "READY";
  }

  const elapsed = nowMs - new Date(lastActionAt).getTime();
  if (elapsed >= cooldownMs) {
    return "READY";
  }

  return convertCountdown(cooldownMs - elapsed);
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

    const petReady = getActionAvailability(nowMs, player.lastCare.pet, getActionCooldownMs("pet"));
    const feedReady = summary.sleeping
      ? `ASLEEP (${convertCountdown(summary.remainingMs)})`
      : getActionAvailability(nowMs, player.lastCare.feed, getActionCooldownMs("feed"));
    const playReady = summary.sleeping
      ? `ASLEEP (${convertCountdown(summary.remainingMs)})`
      : getActionAvailability(nowMs, player.lastCare.play, getActionCooldownMs("play"));

    const command = new CommandContext();
    const embed = new EmbedBuilder()
      .setTitle("Cooldowns")
      .setColor(command.pink)
      .setDescription(`Current interaction availability for **${player.kirbyName}**.`)
      .addFields(
        {
          name: "Sleep Status",
          value: summary.sleeping
            ? `ASLEEP (${convertCountdown(summary.remainingMs)} left)`
            : "AWAKE",
          inline: false,
        },
        {
          name: "Pet",
          value: petReady,
          inline: true,
        },
        {
          name: "Feed",
          value: feedReady,
          inline: true,
        },
        {
          name: "Play",
          value: playReady,
          inline: true,
        }
      )
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
};
