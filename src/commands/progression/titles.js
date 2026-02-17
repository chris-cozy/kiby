const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const titleService = require("../../services/titleService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

const TITLE_CHOICES = titleService.TITLE_DEFINITIONS.map((title) => ({
  name: title.label,
  value: title.id,
}));

module.exports = {
  name: "titles",
  description: "View and equip unlocked titles.",
  deleted: false,
  options: [
    {
      name: "view",
      description: "View unlocked and locked titles.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "equip",
      description: "Equip an unlocked title.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "title",
          description: "Title to equip",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: TITLE_CHOICES,
        },
      ],
    },
  ],

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "equip") {
      const titleId = interaction.options.getString("title", true);
      const equip = await titleService.equipTitle(interaction.user.id, titleId, new Date());
      if (!equip.ok) {
        await safeReply(interaction, {
          content: "That title is not unlocked yet.",
          ephemeral: true,
        });
        return;
      }

      await safeReply(interaction, {
        content: `Equipped title: **${equip.titleLabel}**.`,
        ephemeral: true,
      });
      return;
    }

    const state = await titleService.ensureTitlesForUser(interaction.user.id, new Date());
    const command = new CommandContext();
    const embed = new EmbedBuilder()
      .setTitle("Titles")
      .setColor(command.pink)
      .setDescription(
        state.equipped
          ? `Equipped: **${state.catalog.find((title) => title.id === state.equipped)?.label || state.equipped}**`
          : "No title equipped."
      )
      .addFields(
        state.catalog.map((title) => ({
          name: `${title.unlocked ? "UNLOCKED" : "LOCKED"} ${title.label}`,
          value: `${title.description}${title.equipped ? "\nCurrent: Equipped" : ""}`,
          inline: false,
        }))
      )
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
};
