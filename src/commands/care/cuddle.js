const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const careService = require("../../services/careService");
const convertCountdown = require("../../utils/convertCountdown");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "cuddle",
  description: "Cuddle your Kiby for comfort and social warmth.",
  deleted: false,
  devOnly: false,
  testOnly: false,

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: false });

    const result = await careService.runActionForUser(
      interaction.user.id,
      "cuddle",
      new Date()
    );

    if (!result.ok) {
      if (result.reason === "missing-player") {
        await safeReply(interaction, {
          content: "You do not have a Kiby yet. Use `/adopt` first.",
          ephemeral: true,
        });
        return;
      }

      if (result.reason === "cooldown") {
        await safeReply(interaction, {
          content: `You can cuddle again in ${convertCountdown(result.waitMs)}.`,
          ephemeral: true,
        });
        return;
      }

      if (result.reason === "adventuring") {
        await safeReply(interaction, {
          content: `**${result.player.kirbyName}** is currently on an adventure. Care actions are locked until they return.`,
          ephemeral: true,
        });
        return;
      }
    }

    const command = new CommandContext();
    const media = await command.get_media_attachment("cuddle");
    const { player, updates } = result;

    const embed = new EmbedBuilder()
      .setTitle("Cuddle Time")
      .setColor(command.pink)
      .setDescription(`**${interaction.user.username}** cuddled **${player.kirbyName}**.`)
      .addFields(
        {
          name: "Affection",
          value: `${updates.affectionGranted >= 0 ? "+" : ""}${updates.affectionGranted} (now ${player.affection}/100)`,
          inline: true,
        },
        {
          name: "XP",
          value: `+${updates.xpGranted}`,
          inline: true,
        }
      )
      .setImage(media.mediaString)
      .setTimestamp()
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL(),
      });

    if (updates.leveledUp) {
      embed.addFields({
        name: "Level Up",
        value: `**${player.kirbyName}** reached level **${updates.newLevel}**!`,
      });
    }

    await safeReply(interaction, {
      embeds: [embed],
      files: [media.mediaAttach],
    });
  },
};
