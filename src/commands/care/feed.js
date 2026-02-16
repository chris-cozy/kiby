const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const careService = require("../../services/careService");
const convertCountdown = require("../../utils/convertCountdown");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "feed",
  description: "Feed your Kiby.",
  deleted: false,
  devOnly: false,
  testOnly: false,

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: false });

    const result = await careService.runActionForUser(
      interaction.user.id,
      "feed",
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
          content: `**${result.player.kirbyName}** is asleep. Feeding unlocks after wake-up.`,
          ephemeral: true,
        });
        return;
      }

      if (result.reason === "full") {
        await safeReply(interaction, {
          content: `**${result.player.kirbyName}** is already full.`,
          ephemeral: true,
        });
        return;
      }

      if (result.reason === "cooldown") {
        await safeReply(interaction, {
          content: `You can feed again in ${convertCountdown(result.waitMs)}.`,
          ephemeral: true,
        });
        return;
      }
    }

    const command = new CommandContext();
    const media = await command.get_media_attachment("feed");
    const { player, updates } = result;

    const embed = new EmbedBuilder()
      .setTitle("Feeding")
      .setColor(command.pink)
      .setDescription(`**${interaction.user.username}** fed **${player.kirbyName}**.`)
      .addFields(
        {
          name: "Hunger",
          value: `+${updates.hungerGranted} (now ${player.hunger}/100)`,
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
        inline: false,
      });
    }

    await safeReply(interaction, {
      embeds: [embed],
      files: [media.mediaAttach],
    });
  },
};
