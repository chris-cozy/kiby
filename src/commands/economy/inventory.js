const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const economyService = require("../../services/economyService");
const playerService = require("../../services/playerService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "inventory",
  description: "View your item inventory and coin balance.",
  deleted: false,

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

    const economy = await economyService.getEconomy(interaction.user.id);
    const items = economyService.listShopItems();
    const command = new CommandContext();

    const fields = items.map((item) => ({
      name: item.label,
      value: `${economy.inventory.get(item.id) || 0}`,
      inline: true,
    }));

    const embed = new EmbedBuilder()
      .setTitle("Inventory")
      .setColor(command.pink)
      .setDescription(`Star Coins: **${economy.starCoins}**`)
      .addFields(fields)
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
};
