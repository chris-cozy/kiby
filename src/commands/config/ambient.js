const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const playerService = require("../../services/playerService");
const playerRepository = require("../../repositories/playerRepository");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "ambient",
  description: "Configure autonomous Kiby ambient behaviors.",
  deleted: false,
  options: [
    {
      name: "view",
      description: "View ambient behavior settings.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "set",
      description: "Enable or disable ambient behavior messages.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "enabled",
          description: "Whether ambient messages are enabled.",
          type: ApplicationCommandOptionType.Boolean,
          required: true,
        },
      ],
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

    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "set") {
      const enabled = interaction.options.getBoolean("enabled", true);
      player.ambientOptIn = enabled;
      await playerRepository.savePlayer(player);
      await safeReply(interaction, {
        content: `Ambient behavior messages are now **${enabled ? "enabled" : "disabled"}**.`,
        ephemeral: true,
      });
      return;
    }

    const command = new CommandContext();
    const embed = new EmbedBuilder()
      .setTitle("Ambient Settings")
      .setColor(command.pink)
      .setDescription(
        `Ambient messages are currently **${player.ambientOptIn ? "enabled" : "disabled"}**.`
      )
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
};
