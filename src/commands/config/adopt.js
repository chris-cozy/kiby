const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const playerService = require("../../services/playerService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "adopt",
  description: "Adopt your Kiby!",
  deleted: false,
  options: [
    {
      name: "name",
      description: "Choose your Kiby's name.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: false });

    try {
      const targetName = interaction.options.get("name", true).value;
      const result = await playerService.adoptPlayer(interaction.user.id, targetName);

      if (!result.created) {
        await safeReply(interaction, {
          content: `You already have **${result.player.kirbyName}** to care for.`,
          ephemeral: true,
        });
        return;
      }

      const command = new CommandContext();
      const media = await command.get_media_attachment("portrait");

      const embed = new EmbedBuilder()
        .setTitle("Adoption Complete")
        .setColor(command.pink)
        .setDescription(
          `You adopted **${result.player.kirbyName}**. Keep their hunger and affection up to help them thrive.`
        )
        .addFields(
          {
            name: "Sleep Schedule",
            value: "Use `/sleep schedule set` to configure local bedtime.",
            inline: false,
          },
          {
            name: "Starter Stats",
            value: "HP 100, Hunger 100, Affection 100",
            inline: false,
          }
        )
        .setImage(media.mediaString)
        .setFooter({
          text: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await safeReply(interaction, {
        embeds: [embed],
        files: [media.mediaAttach],
      });
    } catch (error) {
      await safeReply(interaction, {
        content: `Could not adopt Kiby: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
