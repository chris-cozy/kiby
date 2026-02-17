const progressionService = require("../../services/progressionService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "daily",
  description: "Claim your daily Star Coin reward.",
  deleted: false,

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });

    const result = await progressionService.claimDailyReward(
      interaction.user.id,
      new Date()
    );

    if (!result.ok) {
      await safeReply(interaction, {
        content: `Daily reward already claimed today. Reset follows your local quest timezone (**${result.timezone}**).`,
        ephemeral: true,
      });
      return;
    }

    await safeReply(interaction, {
      content: `Claimed **${result.reward} Star Coins**. Current streak: **${result.streak}** day(s). Shield charges: **${result.streakShieldCharges}**. Next reset in about **${Math.max(
        1,
        Math.floor(result.resetInSeconds / 60)
      )}m** (${result.timezone}).`,
      ephemeral: true,
    });
  },
};
