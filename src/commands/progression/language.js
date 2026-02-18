const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const languageService = require("../../services/languageService");
const playerService = require("../../services/playerService");
const env = require("../../config/env");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "language",
  description: "View your Kiby-language translation progress.",
  deleted: false,

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });

    const player = await playerService.getPlayerByUserId(interaction.user.id);
    if (!player) {
      await safeReply(interaction, {
        content: "Adopt a Kiby first to start learning Kiby language.",
        ephemeral: true,
      });
      return;
    }

    const status = await languageService.getLanguageStatus(
      interaction.user.id,
      new Date()
    );
    const nextLevelXp = status.level * env.languageXpPerLevel;
    const glossary =
      status.glossarySample
        .map((entry) => `${entry.token} -> ${entry.translation}`)
        .join("\n") || "No terms translated yet.";

    const command = new CommandContext();
    const embed = new EmbedBuilder()
      .setTitle("Kiby Language")
      .setColor(command.pink)
      .setDescription("Decode your Kiby's language through repeated exposure.")
      .addFields(
        {
          name: "Translation Level",
          value: `${status.level}`,
          inline: true,
        },
        {
          name: "XP",
          value: `${status.xp}/${nextLevelXp}`,
          inline: true,
        },
        {
          name: "Discovered Terms",
          value: `${status.discoveredCount}/${status.totalTerms}`,
          inline: true,
        },
        {
          name: "Unknown Terms",
          value: `${status.unknownCount}`,
          inline: true,
        },
        {
          name: "Glossary Sample",
          value: glossary,
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
