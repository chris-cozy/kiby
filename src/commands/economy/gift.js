const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const economyService = require("../../services/economyService");
const progressionService = require("../../services/progressionService");
const playerService = require("../../services/playerService");
const notificationService = require("../../services/notificationService");
const logger = require("../../utils/logger");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

const ITEM_CHOICES = economyService.listShopItems().map((item) => ({
  name: item.label,
  value: item.id,
}));

function isAccountOldEnough(user, minimumDays = 7) {
  const ageMs = Date.now() - user.createdAt.getTime();
  return ageMs >= minimumDays * 24 * 60 * 60 * 1000;
}

module.exports = {
  name: "gift",
  description: "Gift Star Coins or inventory items to another player.",
  deleted: false,
  options: [
    {
      name: "coins",
      description: "Gift Star Coins to another player.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "Recipient",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: "amount",
          description: "Amount of Star Coins to send",
          type: ApplicationCommandOptionType.Integer,
          required: true,
          min_value: 1,
          max_value: 500,
        },
      ],
    },
    {
      name: "item",
      description: "Gift an item from your inventory.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "Recipient",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: "item",
          description: "Item to gift",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: ITEM_CHOICES,
        },
        {
          name: "quantity",
          description: "Quantity",
          type: ApplicationCommandOptionType.Integer,
          required: false,
          min_value: 1,
          max_value: 10,
        },
      ],
    },
  ],

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser("user", true);
    const actor = await playerService.getPlayerByUserId(interaction.user.id);

    if (!actor && !isAccountOldEnough(interaction.user, 7)) {
      await safeReply(interaction, {
        content:
          "Gifting is unlocked with a level 3 Kiby or a 7+ day old Discord account.",
        ephemeral: true,
      });
      return;
    }

    if (actor && actor.level < 3 && !isAccountOldEnough(interaction.user, 7)) {
      await safeReply(interaction, {
        content: "Gifting unlocks at Kiby level 3 (or 7+ day account age).",
        ephemeral: true,
      });
      return;
    }

    if (target.bot) {
      await safeReply(interaction, {
        content: "You cannot gift to bot users.",
        ephemeral: true,
      });
      return;
    }

    const now = new Date();
    if (subcommand === "coins") {
      const amount = interaction.options.getInteger("amount", true);
      const result = await economyService.transferCoins(
        interaction.user.id,
        target.id,
        amount,
        now
      );

      if (!result.ok) {
        const map = {
          "self-transfer": "You cannot gift to yourself.",
          "invalid-amount": "Invalid coin amount.",
          "daily-cap": `You reached your daily coin gifting cap. Remaining: ${result.remaining || 0}.`,
          "insufficient-funds": `You need **${result.required}** coins (including fee) but only have **${result.current}**.`,
        };
        await safeReply(interaction, {
          content: map[result.reason] || "Coin gift failed.",
          ephemeral: true,
        });
        return;
      }

      await progressionService.recordGiftAction(
        interaction.user.id,
        { coinsAmount: amount },
        now
      );

      const notified = await notificationService.sendGiftReceivedNotification(
        _client,
        target.id,
        {
          type: "coins",
          amount: result.amount,
          senderName: interaction.user.username,
        }
      );
      if (!notified) {
        logger.warn("Gift coin receiver notification failed", {
          fromUserId: interaction.user.id,
          toUserId: target.id,
          amount: result.amount,
        });
      }

      await safeReply(interaction, {
        content: `Sent **${result.amount}** Star Coins to **${target.username}** (fee: **${result.fee}**).`,
        ephemeral: true,
      });
      return;
    }

    const itemId = interaction.options.getString("item", true);
    const quantity = interaction.options.getInteger("quantity") || 1;
    const result = await economyService.transferItem(
      interaction.user.id,
      target.id,
      itemId,
      quantity,
      now
    );

    if (!result.ok) {
      const map = {
        "self-transfer": "You cannot gift to yourself.",
        "invalid-amount": "Invalid quantity.",
        "daily-cap": `You reached your daily item gifting cap. Remaining: ${result.remaining || 0}.`,
        "missing-item": `You only have **${result.available || 0}** of that item.`,
        "non-tradable": `**${result.item?.label || "This item"}** cannot be traded.`,
      };
      await safeReply(interaction, {
        content: map[result.reason] || "Item gift failed.",
        ephemeral: true,
      });
      return;
    }

    await progressionService.recordGiftAction(
      interaction.user.id,
      { itemQuantity: quantity },
      now
    );

    const notified = await notificationService.sendGiftReceivedNotification(
      _client,
      target.id,
      {
        type: "item",
        quantity: result.quantity,
        itemLabel: result.item.label,
        senderName: interaction.user.username,
      }
    );
    if (!notified) {
      logger.warn("Gift item receiver notification failed", {
        fromUserId: interaction.user.id,
        toUserId: target.id,
        itemId: result.item.id,
        quantity: result.quantity,
      });
    }

    const command = new CommandContext();
    const embed = new EmbedBuilder()
      .setTitle("Gift Sent")
      .setColor(command.pink)
      .setDescription(
        `Sent **${result.quantity}x ${result.item.label}** to **${target.username}**.`
      )
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
};
