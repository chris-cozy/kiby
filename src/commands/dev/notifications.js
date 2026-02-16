const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const env = require("../../config/env");
const playerRepository = require("../../repositories/playerRepository");
const { safeDefer, safeReply } = require("../../utils/interactionReply");
const logger = require("../../utils/logger");

module.exports = {
  name: "system",
  description: "Send a system message to all active players.",
  deleted: false,
  devOnly: true,
  options: [
    {
      name: "subject",
      description: "Message subject",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "body",
      description: "Message body",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });

    if (!env.devUserIds.includes(interaction.user.id)) {
      await safeReply(interaction, {
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
      return;
    }

    const subject = interaction.options.getString("subject", true);
    const body = interaction.options.getString("body", true).replace(/\\n/g, "\n");

    const embed = new EmbedBuilder()
      .setTitle(subject)
      .setColor("#FF69B4")
      .setDescription(body)
      .setFooter({ text: "Kiby System" })
      .setTimestamp();

    const players = await playerRepository.listAllPlayers();
    let sent = 0;

    for (const player of players) {
      try {
        const user = await client.users.fetch(player.userId);
        if (!user) {
          continue;
        }

        const dm = await user.createDM();
        await dm.send({ embeds: [embed] });
        sent += 1;
      } catch (error) {
        logger.warn("Failed to send system message", {
          userId: player.userId,
          error: error.message,
        });
      }
    }

    await safeReply(interaction, {
      content: `System message delivered to ${sent}/${players.length} active players.`,
      ephemeral: true,
    });
  },
};
