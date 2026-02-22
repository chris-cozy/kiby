const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const economyService = require("../../services/economyService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");
const {
  recordTutorialEventAndFollowUp,
} = require("../../utils/tutorialFollowUp");

const ITEM_CHOICES = economyService.listShopItems().map((item) => ({
  name: item.label,
  value: item.id,
}));

module.exports = {
  name: "shop",
  description: "Browse and buy Kiby items.",
  deleted: false,
  options: [
    {
      name: "list",
      description: "List shop items.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "buy",
      description: "Buy an item.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "item",
          description: "Item to buy",
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

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });

    const command = new CommandContext();
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "list") {
      const economy = await economyService.getEconomy(interaction.user.id);
      const items = economyService.listShopItems();
      const media = await command.get_media_attachment("shop");

      const embed = new EmbedBuilder()
        .setTitle("Kiby Shop")
        .setColor(command.pink)
        .setDescription(`Balance: **${economy.starCoins} Star Coins**`)
        .addFields(
          items.map((item) => ({
            name: `${item.label} (${item.cost})`,
            value: `${item.description}\nCategory: **${item.category}** | Use: **${item.useContexts.join(", ")}**`,
            inline: false,
          }))
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
        "economy-interaction",
        { interaction: "shop-list" },
        new Date()
      );
      return;
    }

    const itemId = interaction.options.getString("item", true);
    const quantity = interaction.options.getInteger("quantity") || 1;

    const result = await economyService.buyItem(interaction.user.id, itemId, quantity);

    if (!result.ok) {
      if (result.reason === "insufficient-funds") {
        await safeReply(interaction, {
          content: `You need **${result.required}** Star Coins but only have **${result.current}**.`,
          ephemeral: true,
        });
        return;
      }

      await safeReply(interaction, {
        content: "That item is not available.",
        ephemeral: true,
      });
      return;
    }

    await safeReply(interaction, {
      content: `Purchased **${result.quantity}x ${result.item.label}** for **${result.cost}** Star Coins. Balance: **${result.economy.starCoins}**.`,
      ephemeral: true,
    });
  },
};
