const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const socialService = require("../../services/socialService");
const notificationService = require("../../services/notificationService");
const convertCountdown = require("../../utils/convertCountdown");
const logger = require("../../utils/logger");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "social",
  description: "Social interactions between Kibys.",
  deleted: false,
  options: [
    {
      name: "play-with",
      description: "One-way social play with another player's Kiby (no notification sent).",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "Target player",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    },
    {
      name: "interact",
      description:
        "Interact directly with another player's Kiby (opt-in, receiver cooldown, and notification).",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "Target player",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: "action",
          description: "Interaction type",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Cheer", value: "cheer" },
            { name: "Encourage", value: "encourage" },
            { name: "Wave", value: "wave" },
          ],
        },
      ],
    },
    {
      name: "settings",
      description: "Configure social settings for your Kiby.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "opt_in",
          description: "Allow other users' Kibys to directly interact with your Kiby.",
          type: ApplicationCommandOptionType.Boolean,
          required: true,
        },
      ],
    },
  ],

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "settings") {
      const enabled = interaction.options.getBoolean("opt_in", true);
      const result = await socialService.setSocialOptIn(interaction.user.id, enabled);

      if (!result.ok) {
        await safeReply(interaction, {
          content: "You need an active Kiby to configure social settings.",
          ephemeral: true,
        });
        return;
      }

      await safeReply(interaction, {
        content: `Direct social interactions are now **${enabled ? "enabled" : "disabled"}** for your Kiby.`,
        ephemeral: true,
      });
      return;
    }

    const target = interaction.options.getUser("user", true);
    if (target.bot) {
      await safeReply(interaction, {
        content: "You cannot target bot users.",
        ephemeral: true,
      });
      return;
    }

    if (subcommand === "play-with") {
      const result = await socialService.oneWayPlayWithUser(
        interaction.user.id,
        target.id,
        new Date()
      );

      if (!result.ok) {
        const map = {
          "self-target": "You cannot use this action on yourself.",
          "missing-player": "You need an active Kiby first.",
          "missing-target": "That user does not have an active Kiby.",
          cooldown: `You can social-play again in ${convertCountdown(result.waitMs)}.`,
          "diminishing-returns":
            "Diminishing returns reached for this target today. Try a different Kiby.",
        };
        await safeReply(interaction, {
          content: map[result.reason] || "Social play failed.",
          ephemeral: true,
        });
        return;
      }

      const command = new CommandContext();
      const embed = new EmbedBuilder()
        .setTitle("One-Way Social Play")
        .setColor(command.pink)
        .setDescription(
          `Your Kiby played with **${target.username}**'s Kiby (one-way, no notification sent).`
        )
        .addFields(
          {
            name: "Social",
            value: `+${result.socialGain}`,
            inline: true,
          },
          {
            name: "Affection",
            value: `+${result.affectionGain}`,
            inline: true,
          },
          {
            name: "Target Streak",
            value: `${result.countToday} today`,
            inline: true,
          }
        )
        .setTimestamp();

      await safeReply(interaction, {
        embeds: [embed],
        ephemeral: true,
      });
      return;
    }

    const action = interaction.options.getString("action", true);
    const result = await socialService.interactWithPlayerKiby(
      interaction.user.id,
      target.id,
      action,
      new Date()
    );

    if (!result.ok) {
      const map = {
        "self-target": "You cannot use this action on yourself.",
        "missing-player": "You need an active Kiby first.",
        "missing-target": "That user does not have an active Kiby.",
        "target-opted-out": "That player has not opted in to direct social interactions.",
        cooldown: `You can interact again in ${convertCountdown(result.waitMs)}.`,
        "target-cooldown": `That Kiby recently received a social interaction. Try again in ${convertCountdown(
          result.waitMs
        )}.`,
      };
      await safeReply(interaction, {
        content: map[result.reason] || "Social interaction failed.",
        ephemeral: true,
      });
      return;
    }

    const notified = await notificationService.sendSocialInteractionReceivedNotification(
      _client,
      target.id,
      {
        senderName: interaction.user.username,
        action,
        targetAffectionGain: result.targetAffectionGain,
        targetSocialGain: result.targetSocialGain,
      }
    );
    if (!notified) {
      logger.warn("Social interaction receiver notification failed", {
        senderUserId: interaction.user.id,
        targetUserId: target.id,
        action,
      });
    }

    const command = new CommandContext();
    const media = await command.get_media_attachment("social");
    const embed = new EmbedBuilder()
      .setTitle("Social Interaction")
      .setColor(command.pink)
      .setDescription(
        `You used **${action}** on **${target.username}**'s Kiby.`
      )
      .addFields(
        {
          name: "Your Kiby Social",
          value: `+${result.senderGain} (now ${result.senderSocialNow}/100)`,
          inline: true,
        },
        {
          name: "Target Affection",
          value: `+${result.targetAffectionGain} (now ${result.targetAffectionNow}/100)`,
          inline: true,
        },
        {
          name: "Target Social",
          value: `+${result.targetSocialGain} (now ${result.targetSocialNow}/100)`,
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
  },
};
