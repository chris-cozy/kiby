const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const parkService = require("../../services/parkService");
const convertCountdown = require("../../utils/convertCountdown");
const { safeDefer, safeReply } = require("../../utils/interactionReply");
const {
  recordTutorialEventAndFollowUp,
} = require("../../utils/tutorialFollowUp");

const DURATION_CHOICES = parkService.DURATION_OPTIONS_MINUTES.map((minutes) => ({
  name: `${minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}`,
  value: minutes,
}));

module.exports = {
  name: "park",
  description: "Send your Kiby to the park for social time.",
  deleted: false,
  options: [
    {
      name: "send",
      description: "Send your Kiby to the park for a selected duration.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "duration",
          description: "How long your Kiby should stay at the park.",
          type: ApplicationCommandOptionType.Integer,
          required: true,
          choices: DURATION_CHOICES,
        },
      ],
    },
    {
      name: "status",
      description: "Check park occupancy and your active park session.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "leave",
      description: "Bring your Kiby back from the park.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "status") {
      const status = await parkService.getParkStatus(interaction.user.id, new Date());
      const session = status.session;

      if (!session) {
        await safeReply(interaction, {
          content: `Kibys currently at the park: **${status.activeCount}**.\nYour Kiby is not currently at the park.`,
          ephemeral: true,
        });
        return;
      }

      const command = new CommandContext();
      const media = await command.get_media_attachment("park");
      const embed = new EmbedBuilder()
        .setTitle("Park Status")
        .setColor(command.pink)
        .addFields(
          {
            name: "Kibys At Park",
            value: `${status.activeCount}`,
            inline: true,
          },
          {
            name: "State",
            value: session.status === "active" ? "AT PARK" : "READY TO LEAVE",
            inline: true,
          },
          {
            name: "Duration",
            value: `${session.durationMinutes}m`,
            inline: true,
          },
          {
            name: "Time Remaining",
            value:
              session.status === "active"
                ? convertCountdown(session.msRemaining)
                : "0m (ready)",
            inline: true,
          }
        )
        .setImage(media.mediaString)
        .setTimestamp();

      await safeReply(interaction, {
        embeds: [embed],
        files: [media.mediaAttach],
        ephemeral: true,
      });
      return;
    }

    if (subcommand === "leave") {
      const left = await parkService.leavePark(interaction.user.id, new Date());
      if (!left.ok) {
        const map = {
          "missing-player": "You need an active Kiby first.",
          "missing-session": "Your Kiby is not currently at the park.",
        };
        await safeReply(interaction, {
          content: map[left.reason] || "Could not leave park right now.",
          ephemeral: true,
        });
        return;
      }

      const command = new CommandContext();
      const media = await command.get_media_attachment("park");
      const embed = new EmbedBuilder()
        .setTitle(left.completed ? "Park Visit Complete" : "Left Park Early")
        .setColor(command.pink)
        .setDescription(
          left.completed
            ? "Your Kiby had a full park session."
            : "Your Kiby returned early from the park."
        )
        .addFields(
          {
            name: "Elapsed Time",
            value: `${left.elapsedMinutes}m / ${left.plannedDurationMinutes}m`,
            inline: true,
          },
          {
            name: "Social",
            value: `+${left.socialGain} (now ${left.socialNow}/100)`,
            inline: true,
          },
          {
            name: "Hunger",
            value: `-${left.hungerLoss} (now ${left.hungerNow}/100)`,
            inline: true,
          }
        )
        .setImage(media.mediaString)
        .setTimestamp();

      await safeReply(interaction, {
        embeds: [embed],
        files: [media.mediaAttach],
        ephemeral: true,
      });
      await recordTutorialEventAndFollowUp(
        interaction,
        interaction.user.id,
        "park-leave",
        {},
        new Date()
      );
      return;
    }

    const duration = interaction.options.getInteger("duration", true);
    const sent = await parkService.sendToPark(interaction.user.id, duration, new Date());
    if (!sent.ok) {
      const map = {
        "missing-player": "You need an active Kiby first.",
        "invalid-duration": "Choose one of the preset park durations.",
        "already-active": "Your Kiby is already at the park.",
        "leave-required": "Your last park visit is ready. Use `/park leave` first.",
        adventuring: "Your Kiby is currently adventuring and unavailable.",
      };
      await safeReply(interaction, {
        content: map[sent.reason] || "Could not send your Kiby to the park.",
        ephemeral: true,
      });
      return;
    }

    const session = sent.session;
    const command = new CommandContext();
    const media = await command.get_media_attachment("park");
    const embed = new EmbedBuilder()
      .setTitle("Park Visit Started")
      .setColor(command.pink)
      .setDescription(
        `Your Kiby is at the park for **${session.durationMinutes}m**.`
      )
      .addFields(
        {
          name: "Leave In",
          value: convertCountdown(session.msRemaining),
          inline: true,
        },
        {
          name: "Effects",
          value: "Hidden until `/park leave`.",
          inline: true,
        }
      )
      .setImage(media.mediaString)
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      files: [media.mediaAttach],
      ephemeral: true,
    });
    await recordTutorialEventAndFollowUp(
      interaction,
      interaction.user.id,
      "park-send",
      {},
      new Date()
    );
  },
};
