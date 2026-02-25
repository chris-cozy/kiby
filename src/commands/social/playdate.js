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
const {
  recordTutorialEventAndFollowUp,
} = require("../../utils/tutorialFollowUp");

module.exports = {
  name: "playdate",
  description: "Set up a 1-on-1 playdate between your Kiby and another Kiby.",
  deleted: false,
  options: [
    {
      name: "send",
      description: "Start a 1-on-1 playdate with another Kiby.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "kiby",
          description: "Choose a Kiby (players + NPCs).",
          type: ApplicationCommandOptionType.String,
          required: true,
          autocomplete: true,
        },
      ],
    },
    {
      name: "settings",
      description: "Configure direct playdate settings.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "opt_in",
          description: "Allow direct playdates from other players.",
          type: ApplicationCommandOptionType.Boolean,
          required: true,
        },
      ],
    },
  ],

  autocomplete: async (_client, interaction) => {
    const focused = interaction.options.getFocused(true);
    if (!focused || focused.name !== "kiby") {
      await interaction.respond([]);
      return;
    }

    try {
      const rows = await socialService.listPlaydateTargets(
        focused.value || "",
        25,
        interaction.user.id
      );
      if (!rows.length) {
        const typed = String(focused.value || "").trim().slice(0, 100);
        await interaction.respond([
          {
            name: typed ? `Use typed name: ${typed}`.slice(0, 100) : "Type a Kiby name to search",
            value: typed || "__no_target__",
          },
        ]);
        return;
      }

      await interaction.respond(
        rows.map((row) => ({
          name: row.name,
          value: row.value,
        }))
      );
    } catch {
      const typed = String(focused.value || "").trim().slice(0, 100);
      await interaction.respond([
        {
          name: typed ? `Use typed name: ${typed}`.slice(0, 100) : "Type a Kiby name to search",
          value: typed || "__no_target__",
        },
      ]);
    }
  },

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "settings") {
      const enabled = interaction.options.getBoolean("opt_in", true);
      const result = await socialService.setSocialOptIn(interaction.user.id, enabled);

      if (!result.ok) {
        await safeReply(interaction, {
          content: "You need an active Kiby to configure playdate settings.",
          ephemeral: true,
        });
        return;
      }

      await safeReply(interaction, {
        content: `Direct playdates are now **${enabled ? "enabled" : "disabled"}** for your Kiby.`,
        ephemeral: true,
      });
      await recordTutorialEventAndFollowUp(
        interaction,
        interaction.user.id,
        "playdate-settings",
        { optIn: enabled },
        new Date()
      );
      return;
    }

    const targetToken = interaction.options.getString("kiby", true);
    const result = await socialService.runPlaydate(
      interaction.user.id,
      targetToken,
      new Date()
    );

    if (!result.ok) {
      const map = {
        "missing-player": "You need an active Kiby first.",
        "missing-target": "That Kiby could not be found. Pick one from autocomplete.",
        "self-target": "You cannot playdate with your own Kiby.",
        "target-opted-out": "That player has not opted in to direct playdates.",
        cooldown: `You can playdate again in ${convertCountdown(result.waitMs)}.`,
        "target-cooldown": `That Kiby recently received a playdate. Try again in ${convertCountdown(
          result.waitMs
        )}.`,
        adventuring: "Your Kiby is currently adventuring and unavailable.",
        "at-park": "Your Kiby is currently at the park and unavailable.",
      };
      await safeReply(interaction, {
        content: map[result.reason] || "Playdate failed.",
        ephemeral: true,
      });
      return;
    }

    if (result.targetType === "player" && result.targetOwnerUserId) {
      const notified = await notificationService.sendSocialInteractionReceivedNotification(
        client,
        result.targetOwnerUserId,
        {
          senderName: interaction.user.username,
          action: "playdate",
          targetAffectionGain: result.targetAffectionGain,
          targetSocialGain: result.targetSocialGain,
        }
      );

      if (!notified) {
        logger.warn("Playdate receiver notification failed", {
          senderUserId: interaction.user.id,
          targetUserId: result.targetOwnerUserId,
        });
      }
    }

    const command = new CommandContext();
    const media = await command.get_media_attachment("playdate");
    const targetLabel =
      result.targetType === "npc"
        ? `${result.targetKirbyName} ✧`
        : `${result.targetKirbyName}`;
    const embed = new EmbedBuilder()
      .setTitle("Playdate Complete")
      .setColor(command.pink)
      .setDescription(`Your Kiby spent time with **${targetLabel}**.`)
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
    await recordTutorialEventAndFollowUp(
      interaction,
      interaction.user.id,
      "playdate-action",
      {
        targetType: result.targetType,
        targetId: result.targetId,
      },
      new Date()
    );
  },
};
