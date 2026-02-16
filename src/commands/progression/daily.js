const progressionService = require("../../services/progressionService");
const playerService = require("../../services/playerService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "daily",
  description: "Claim your daily Star Coin reward.",
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

    const result = await progressionService.claimDailyReward(interaction.user.id);

    if (!result.ok) {
      await safeReply(interaction, {
        content: "Daily reward already claimed today. Come back after UTC reset.",
        ephemeral: true,
      });
      return;
    }

    await safeReply(interaction, {
      content: `Claimed **${result.reward} Star Coins**. Current streak: **${result.streak}** day(s).`,
      ephemeral: true,
    });
  },
};
