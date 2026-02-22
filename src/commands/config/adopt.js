const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const playerService = require("../../services/playerService");
const onboardingService = require("../../services/onboardingService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");
const {
  safeTutorialFollowUp,
  sendTutorialPromptForStatus,
} = require("../../utils/tutorialFollowUp");

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
      const now = new Date();
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
      const media = await command.get_media_attachment("adopt");

      const embed = new EmbedBuilder()
        .setTitle("Adoption Complete")
        .setColor(command.pink)
        .setDescription(
          `You adopted **${result.player.kirbyName}**. Keep their hunger and affection up to help them thrive.`
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

      try {
        const adoption = await onboardingService.registerAdoption(
          interaction.user.id,
          now
        );
        if (adoption.isFirstAdoption) {
          const tutorial = await onboardingService.startTutorial(
            interaction.user.id,
            "first-adopt",
            now
          );
          await safeTutorialFollowUp(
            interaction,
            "Welcome to Dream Land! Let's walk through how to take care of a Kiby"
          );
          await sendTutorialPromptForStatus(interaction, tutorial.status);
        } else {
          await safeTutorialFollowUp(
            interaction,
            "Want a quick refresher for this new Kiby? Use `/tutorial start` to run it again or `/tutorial skip` to dismiss."
          );
        }
      } catch {
        // Ignore onboarding failures so adoption itself always succeeds.
      }
    } catch (error) {
      await safeReply(interaction, {
        content: `Could not adopt Kiby: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
