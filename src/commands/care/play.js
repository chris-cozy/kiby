const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const careService = require("../../services/careService");
const convertCountdown = require("../../utils/convertCountdown");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "play",
  description: "Play with your Kiby.",
  deleted: false,
  devOnly: false,
  testOnly: false,

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: false });

    const result = await careService.runActionForUser(
      interaction.user.id,
      "play",
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

      if (result.reason === "asleep") {
        await safeReply(interaction, {
          content: `**${result.player.kirbyName}** is asleep and cannot play right now.`,
          ephemeral: true,
        });
        return;
      }

      if (result.reason === "cooldown") {
        await safeReply(interaction, {
          content: `You can play again in ${convertCountdown(result.waitMs)}.`,
          ephemeral: true,
        });
        return;
      }
    }

    const command = new CommandContext();
    const media = await command.get_media_attachment("play");
    const { player, updates } = result;

    const embed = new EmbedBuilder()
      .setTitle("Playtime")
      .setColor(command.pink)
      .setDescription(`**${interaction.user.username}** played with **${player.kirbyName}**.`)
      .addFields(
        {
          name: "Affection",
          value: `+${updates.affectionGranted} (now ${player.affection}/100)`,
          inline: true,
        },
        {
          name: "XP",
          value: `+${updates.xpGranted}`,
          inline: true,
        },
        {
          name: "Level",
          value: `${player.level}`,
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
