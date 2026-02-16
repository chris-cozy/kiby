const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const playerRepository = require("../../repositories/playerRepository");
const deathHistoryRepository = require("../../repositories/deathHistoryRepository");
const sleepService = require("../../services/sleepService");
const economyService = require("../../services/economyService");
const progressionService = require("../../services/progressionService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "revive",
  description: "Revive your last Kiby if they passed away.",
  deleted: false,
  devOnly: false,
  testOnly: false,

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: false });

    const existing = await playerRepository.findByUserId(interaction.user.id);
    if (existing) {
      await safeReply(interaction, {
        content: `You already have **${existing.kirbyName}** to care for.`,
        ephemeral: true,
      });
      return;
    }

    const latestDeath = await deathHistoryRepository.findLatestPlayerDeath(
      interaction.user.id
    );

    if (!latestDeath) {
      await safeReply(interaction, {
        content: "You do not have a fallen Kiby to revive.",
        ephemeral: true,
      });
      return;
    }

    const revived = await playerRepository.createPlayer({
      userId: interaction.user.id,
      kirbyName: latestDeath.kirbyName,
      adoptedAt: new Date(),
      lastCare: {
        feed: new Date(),
        pet: new Date(),
        play: new Date(),
      },
    });

    await sleepService.getScheduleForUser(interaction.user.id);
    await Promise.all([
      economyService.ensureEconomy(interaction.user.id),
      progressionService.ensureProgress(interaction.user.id),
    ]);

    const command = new CommandContext();
    const media = await command.get_media_attachment("portrait");

    const embed = new EmbedBuilder()
      .setTitle("Revival Complete")
      .setColor(command.pink)
      .setDescription(`**${revived.kirbyName}** has returned. Protect them this time.`)
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
  },
};
