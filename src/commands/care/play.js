const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const careService = require("../../services/careService");
const economyService = require("../../services/economyService");
const progressionService = require("../../services/progressionService");
const playerRepository = require("../../repositories/playerRepository");
const convertCountdown = require("../../utils/convertCountdown");
const { safeDefer, safeReply } = require("../../utils/interactionReply");
const { followUpFromTutorialUpdate } = require("../../utils/tutorialFollowUp");

const TOY_CHOICES = economyService.listItemsByContext("play").map((item) => ({
  name: item.label,
  value: item.id,
}));

module.exports = {
  name: "play",
  description: "Play with your Kiby.",
  deleted: false,
  devOnly: false,
  testOnly: false,
  options: [
    {
      name: "toy",
      description: "Optional toy to enhance play effects.",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: TOY_CHOICES,
    },
  ],

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

      if (result.reason === "adventuring") {
        await safeReply(interaction, {
          content: `**${result.player.kirbyName}** is currently on an adventure. Care actions are locked until they return.`,
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

    const toyId = interaction.options.getString("toy");

    if (toyId) {
      const toyUse = await economyService.useToyForPlay(
        interaction.user.id,
        toyId,
        result.player,
        new Date()
      );

      if (!toyUse.ok) {
        result.toyError =
          toyUse.reason === "missing-item"
            ? `Toy not applied: you do not have **${toyUse.item.label}** in inventory.`
            : "Toy not applied: invalid toy selection.";
      } else {
        result.updates.affectionGranted += toyUse.effects.affection;
        result.updates.xpGranted += toyUse.effects.xp;
        result.updates.leveledUp = result.updates.leveledUp || toyUse.effects.leveledUp;
        result.updates.newLevel = toyUse.effects.newLevel;
        await playerRepository.savePlayer(result.player);
        await progressionService.recordItemUse(interaction.user.id, new Date());
        result.toyUse = toyUse;
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

    if (result.toyUse) {
      embed.addFields({
        name: "Toy Bonus",
        value: `Used **${result.toyUse.item.label}**${
          result.toyUse.fatigueApplied ? " (fatigue reduced effectiveness)" : ""
        }.`,
        inline: false,
      });
    }

    if (result.toyError) {
      embed.addFields({
        name: "Toy Result",
        value: result.toyError,
        inline: false,
      });
    }

    await safeReply(interaction, {
      embeds: [embed],
      files: [media.mediaAttach],
    });
    await followUpFromTutorialUpdate(
      interaction,
      interaction.user.id,
      result.tutorial,
      new Date()
    );
  },
};
