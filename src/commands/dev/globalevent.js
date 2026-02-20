const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const globalEventService = require("../../services/globalEventService");
const notificationService = require("../../services/notificationService");
const logger = require("../../utils/logger");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

const EVENT_CHOICES = globalEventService.GLOBAL_EVENTS.map((event) => ({
  name: event.title,
  value: event.key,
}));

module.exports = {
  name: "globalevent",
  description: "Developer controls for global events.",
  deleted: false,
  devOnly: true,
  options: [
    {
      name: "start",
      description: "Manually start a specific global event.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "event",
          description: "Global event key",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: EVENT_CHOICES,
        },
      ],
    },
  ],

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });
    const eventKey = interaction.options.getString("event", true);

    const result = await globalEventService.startGlobalEventManually(
      eventKey,
      interaction.user.id,
      new Date()
    );

    if (!result.ok) {
      const map = {
        "unknown-event": "Unknown global event key.",
        "already-active": `Cannot start a new global event while one is active: **${result.event.title}** (ends ${new Date(
          result.event.endsAt
        ).toLocaleString("en-US")}).`,
      };
      await safeReply(interaction, {
        content: map[result.reason] || "Could not start global event.",
        ephemeral: true,
      });
      return;
    }

    let delivered = 0;
    let failed = 0;
    for (const userId of result.activeUserIds || []) {
      const sent = await notificationService.sendGlobalEventStartNotification(
        _client,
        userId,
        result.event
      );
      if (sent) {
        delivered += 1;
      } else {
        failed += 1;
      }
    }

    logger.info("Manual global event started", {
      eventId: result.event.eventId,
      key: result.event.key,
      durationHours: result.durationHours,
      goal: result.event.goal,
      activeUsers: (result.activeUserIds || []).length,
      notificationsDelivered: delivered,
      notificationsFailed: failed,
      nextEligibleAt: result.nextEligibleAt,
      startedByUserId: interaction.user.id,
    });

    const command = new CommandContext();
    const embed = new EmbedBuilder()
      .setTitle(`Global Event Started: ${result.event.title}`)
      .setColor(command.pink)
      .setDescription(result.event.description)
      .addFields(
        {
          name: "Goal",
          value: `${result.event.goal}`,
          inline: true,
        },
        {
          name: "Active Players (24h)",
          value: `${result.event.scalingSnapshot?.activePlayers || 0}`,
          inline: true,
        },
        {
          name: "Goal Multiplier",
          value: `${result.event.scalingSnapshot?.goalMultiplier || 1}`,
          inline: true,
        },
        {
          name: "Ends",
          value: new Date(result.event.endsAt).toLocaleString("en-US"),
          inline: false,
        },
        {
          name: "Notifications",
          value: `Delivered: ${delivered} | Failed: ${failed}`,
          inline: false,
        },
        {
          name: "Next Eligible Start",
          value: new Date(result.nextEligibleAt).toLocaleString("en-US"),
          inline: false,
        }
      )
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
};
