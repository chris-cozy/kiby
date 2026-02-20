const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const economyService = require("../../services/economyService");
const playerService = require("../../services/playerService");
const playerRepository = require("../../repositories/playerRepository");
const progressionService = require("../../services/progressionService");
const seasonService = require("../../services/seasonService");
const globalEventService = require("../../services/globalEventService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

const ITEM_CHOICES = economyService.listShopItems().map((item) => ({
  name: item.label,
  value: item.id,
}));

module.exports = {
  name: "use",
  description: "Use an inventory item on your Kiby.",
  deleted: false,
  options: [
    {
      name: "item",
      description: "Item to consume",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: ITEM_CHOICES,
    },
  ],

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });

    const player = await playerService.getPlayerByUserId(interaction.user.id);
    if (!player) {
      await safeReply(interaction, {
        content: "You need to adopt a Kiby first with `/adopt`.",
        ephemeral: true,
      });
      return;
    }

    const itemId = interaction.options.getString("item", true);
    const result = await economyService.useItem(interaction.user.id, itemId, player);

    if (!result.ok) {
      if (result.reason === "missing-item") {
        await safeReply(interaction, {
          content: `You do not have **${result.item.label}** in your inventory.`,
          ephemeral: true,
        });
        return;
      }

      if (result.reason === "toy-during-play") {
        await safeReply(interaction, {
          content: `**${result.item.label}** is a toy and can be used with \`/play toy:<item>\`.`,
          ephemeral: true,
        });
        return;
      }

      if (result.reason === "unsupported-context") {
        await safeReply(interaction, {
          content: `**${result.item.label}** is a journey support item and can be used with \`/adventure start\`.`,
          ephemeral: true,
        });
        return;
      }

      await safeReply(interaction, {
        content: "That item cannot be used.",
        ephemeral: true,
      });
      return;
    }

    await playerRepository.savePlayer(result.playerProfile);
    await progressionService.recordItemUse(interaction.user.id, new Date());
    await globalEventService.recordContribution(interaction.user.id, 1, new Date());
    if (result.effects.xp > 0) {
      await seasonService.recordEntityProgress(
        "player",
        interaction.user.id,
        player.kirbyName,
        result.effects.xp,
        new Date()
      );
    }

    const command = new CommandContext();
    const embed = new EmbedBuilder()
      .setTitle("Item Used")
      .setColor(command.pink)
      .setDescription(`Used **${result.item.label}** on **${player.kirbyName}**.`)
      .addFields(
        {
          name: "HP",
          value: `${player.hp}/100`,
          inline: true,
        },
        {
          name: "Hunger",
          value: `${player.hunger}/100`,
          inline: true,
        },
        {
          name: "Affection",
          value: `${player.affection}/100`,
          inline: true,
        },
        {
          name: "Social",
          value: `${player.social}/100`,
          inline: true,
        },
        {
          name: "Level",
          value: `${player.level}`,
          inline: true,
        },
        {
          name: "XP",
          value: `${player.xp}`,
          inline: true,
        },
        {
          name: "Coins",
          value: `${result.economy.starCoins}`,
          inline: true,
        }
      )
      .setTimestamp();

    if (result.effects.leveledUp) {
      embed.addFields({
        name: "Level Up",
        value: `${player.kirbyName} reached level ${result.effects.newLevel}.`,
        inline: false,
      });
    }

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
};
