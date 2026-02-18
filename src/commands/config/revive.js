const { EmbedBuilder } = require("discord.js");
const CommandContext = require("../../classes/command");
const playerRepository = require("../../repositories/playerRepository");
const deathHistoryRepository = require("../../repositories/deathHistoryRepository");
const sleepService = require("../../services/sleepService");
const economyService = require("../../services/economyService");
const progressionService = require("../../services/progressionService");
const env = require("../../config/env");
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

    const economy = await economyService.ensureEconomy(interaction.user.id);
    const progress = await progressionService.getProgress(
      interaction.user.id,
      new Date()
    );

    const reviveCost = env.reviveBaseCost + latestDeath.level * env.reviveLevelMultiplier;
    const useToken = (progress.revive?.tokens || 0) > 0;
    if (!useToken && economy.starCoins < reviveCost) {
      await safeReply(interaction, {
        content: `Revive requires **${reviveCost} Star Coins** (you have **${economy.starCoins}**).`,
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
        cuddle: new Date(),
        train: new Date(),
        bathe: new Date(),
        socialPlay: new Date(),
        socialReceived: null,
      },
    });

    if (useToken) {
      await progressionService.consumeReviveToken(interaction.user.id, new Date());
    } else {
      economy.starCoins -= reviveCost;
      await economy.save();
    }

    await sleepService.getScheduleForUser(interaction.user.id);
    await Promise.all([
      economyService.ensureEconomy(interaction.user.id),
      progressionService.ensureProgress(interaction.user.id),
      progressionService.registerRevive(interaction.user.id, new Date()),
    ]);

    const command = new CommandContext();
    const media = await command.get_media_attachment("portrait");

    const embed = new EmbedBuilder()
      .setTitle("Revival Complete")
      .setColor(command.pink)
      .setDescription(
        `**${revived.kirbyName}** has returned. ${
          useToken
            ? "A revive token was consumed."
            : `Revive cost paid: **${reviveCost} Star Coins**.`
        }`
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
  },
};
