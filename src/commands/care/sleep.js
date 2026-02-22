const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const sleepService = require("../../services/sleepService");
const playerService = require("../../services/playerService");
const convertCountdown = require("../../utils/convertCountdown");
const { safeDefer, safeReply } = require("../../utils/interactionReply");
const { searchTimezones } = require("../../utils/timezones");
const {
  recordTutorialEventAndFollowUp,
} = require("../../utils/tutorialFollowUp");

const START_CHOICES = Array.from({ length: 24 }, (_, hour) => {
  const period = hour < 12 ? "AM" : "PM";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return {
    name: `${twelveHour} ${period}`,
    value: hour,
  };
});

const DURATION_CHOICES = Array.from({ length: 9 }, (_, index) => {
  const value = index + 1;
  return {
    name: `${value} hour${value === 1 ? "" : "s"}`,
    value,
  };
});

module.exports = {
  name: "sleep",
  description: "Manage your Kiby's sleep schedule.",
  deleted: false,
  devOnly: false,
  testOnly: false,
  options: [
    {
      name: "schedule",
      description: "Schedule operations",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "set",
          description: "Set timezone, local start time, and duration.",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: "timezone",
              description: "IANA timezone (Region/City, e.g. America/New_York)",
              type: ApplicationCommandOptionType.String,
              required: true,
              autocomplete: true,
            },
            {
              name: "start",
              description: "Local bedtime (12-hour picker)",
              type: ApplicationCommandOptionType.Integer,
              required: true,
              choices: START_CHOICES,
            },
            {
              name: "duration_hours",
              description: "Sleep duration in hours (1-9)",
              type: ApplicationCommandOptionType.Integer,
              required: true,
              choices: DURATION_CHOICES,
            },
          ],
        },
        {
          name: "view",
          description: "View your current sleep schedule.",
          type: ApplicationCommandOptionType.Subcommand,
        },
        {
          name: "clear",
          description: "Reset to default sleep schedule.",
          type: ApplicationCommandOptionType.Subcommand,
        },
      ],
    },
  ],
  autocomplete: async (_client, interaction) => {
    const focused = interaction.options.getFocused(true);
    if (!focused) {
      await interaction.respond([]);
      return;
    }

    if (focused.name === "timezone") {
      const matches = searchTimezones(focused.value || "");
      await interaction.respond(
        matches.map((timezone) => ({
          name: timezone,
          value: timezone,
        }))
      );
      return;
    }

    await interaction.respond([]);
  },

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });

    const player = await playerService.getPlayerByUserId(interaction.user.id);
    if (!player) {
      await safeReply(interaction, {
        content: "You need to adopt a Kiby first with `/adopt`.",
        ephemeral: true,
      });
      return;
    }

    const group = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    if (group !== "schedule") {
      await safeReply(interaction, {
        content: "Unknown sleep command.",
        ephemeral: true,
      });
      return;
    }

    if (subcommand === "set") {
      try {
        const timezone = interaction.options.getString("timezone", true);
        const startHour = interaction.options.getInteger("start", true);
        const start = `${startHour.toString().padStart(2, "0")}:00`;
        const durationHours = interaction.options.getInteger("duration_hours", true);

        const schedule = await sleepService.setScheduleForUser(interaction.user.id, {
          timezone,
          startLocalTime: start,
          durationHours,
        });

        const summary = sleepService.getSleepSummary(schedule, new Date());
        await safeReply(interaction, {
          content: `Sleep schedule updated: **${summary.timezone}**, **${summary.startLocalTime}**, **${summary.durationHours}h** nightly.`,
          ephemeral: true,
        });
        await recordTutorialEventAndFollowUp(
          interaction,
          interaction.user.id,
          "sleep-set",
          {},
          new Date()
        );
      } catch (error) {
        await safeReply(interaction, {
          content: `Could not update schedule: ${error.message}`,
          ephemeral: true,
        });
      }
      return;
    }

    if (subcommand === "clear") {
      const schedule = await sleepService.clearScheduleForUser(interaction.user.id);
      const summary = sleepService.getSleepSummary(schedule, new Date());
      await safeReply(interaction, {
        content: `Sleep schedule reset to default: **${summary.timezone} ${summary.startLocalTime} (${summary.durationHours}h)**.`,
        ephemeral: true,
      });
      return;
    }

    const schedule = await sleepService.getScheduleForUser(interaction.user.id);
    const summary = sleepService.getSleepSummary(schedule, new Date());

    const command = new CommandContext();
    const media = await command.get_media_attachment("sleep");

    const embed = new EmbedBuilder()
      .setTitle("Sleep Schedule")
      .setColor(command.pink)
      .setDescription(`Current sleep configuration for **${player.kirbyName}**.`)
      .addFields(
        {
          name: "Timezone",
          value: summary.timezone,
          inline: true,
        },
        {
          name: "Start",
          value: summary.startLocalTime,
          inline: true,
        },
        {
          name: "Duration",
          value: `${summary.durationHours}h`,
          inline: true,
        },
        {
          name: "Status",
          value: summary.sleeping
            ? `ASLEEP (${convertCountdown(summary.remainingMs)} remaining)`
            : "AWAKE",
          inline: false,
        }
      )
      .setImage(media.mediaString)
      .setTimestamp()
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL(),
      });

    await safeReply(interaction, {
      embeds: [embed],
      files: [media.mediaAttach],
      ephemeral: true,
    });
  },
};
