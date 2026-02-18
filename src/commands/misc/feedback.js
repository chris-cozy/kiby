const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const env = require("../../config/env");
const notificationService = require("../../services/notificationService");
const logger = require("../../utils/logger");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

function buildReferenceId() {
  const stamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `FB-${stamp}-${random}`;
}

module.exports = {
  name: "feedback",
  description: "Send direct feedback to the Kiby developers.",
  deleted: false,
  options: [
    {
      name: "category",
      description: "Feedback category",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Bug", value: "bug" },
        { name: "Balance", value: "balance" },
        { name: "Feature", value: "feature" },
        { name: "UX", value: "ux" },
        { name: "Other", value: "other" },
      ],
    },
    {
      name: "message",
      description: "Feedback details",
      type: ApplicationCommandOptionType.String,
      required: true,
      min_length: 4,
      max_length: 900,
    },
  ],

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });

    const category = interaction.options.getString("category", true);
    const message = interaction.options.getString("message", true);
    const referenceId = buildReferenceId();

    const command = new CommandContext();
    const embed = new EmbedBuilder()
      .setTitle(`Player Feedback (${category.toUpperCase()})`)
      .setColor(command.pink)
      .setDescription(message)
      .addFields(
        {
          name: "Reference ID",
          value: referenceId,
          inline: true,
        },
        {
          name: "Sender",
          value: `${interaction.user.tag} (${interaction.user.id})`,
          inline: true,
        },
        {
          name: "Server",
          value: interaction.guild
            ? `${interaction.guild.name} (${interaction.guild.id})`
            : "Direct Message",
          inline: false,
        }
      )
      .setTimestamp();

    const targets = Array.from(new Set(env.devUserIds.filter(Boolean)));
    let sent = 0;
    for (const userId of targets) {
      const ok = await notificationService.sendDirectMessage(_client, userId, {
        embeds: [embed],
      });
      if (ok) {
        sent += 1;
      } else {
        logger.warn("Failed to fan out feedback DM", {
          referenceId,
          userId,
        });
      }
    }

    await safeReply(interaction, {
      content: `Feedback submitted. Reference ID: **${referenceId}**. Delivered to **${sent}/${targets.length}** developers.`,
      ephemeral: true,
    });
  },
};
