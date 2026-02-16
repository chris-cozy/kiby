const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const progressionService = require("../../services/progressionService");
const playerService = require("../../services/playerService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "quests",
  description: "View and claim daily quest progress.",
  deleted: false,
  options: [
    {
      name: "view",
      description: "View quest status.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "claim",
      description: "Claim completed quest reward.",
      type: ApplicationCommandOptionType.Subcommand,
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
    if (subcommand === "claim") {
      const claim = await progressionService.claimQuestReward(interaction.user.id);
      if (!claim.ok) {
        await safeReply(interaction, {
          content:
            claim.reason === "quest-incomplete"
              ? "Quest is not complete yet."
              : "Quest reward already claimed today.",
          ephemeral: true,
        });
        return;
      }

      await safeReply(interaction, {
        content: `Quest reward claimed: **${claim.reward} Star Coins**.`,
        ephemeral: true,
      });
      return;
    }

    const status = await progressionService.getQuestStatus(interaction.user.id);
    const command = new CommandContext();

    const embed = new EmbedBuilder()
      .setTitle("Daily Quests")
      .setColor(command.pink)
      .setDescription(`Current streak: **${status.dailyStreak}** day(s).`)
      .addFields(
        {
          name: "Quest",
          value: `Use **${status.quest.key}** ${status.quest.goal} times`,
          inline: false,
        },
        {
          name: "Progress",
          value: `${status.quest.progress}/${status.quest.goal}`,
          inline: true,
        },
        {
          name: "Reward",
          value: `${status.quest.rewardCoins} Star Coins`,
          inline: true,
        },
        {
          name: "Status",
          value: status.quest.claimed
            ? "CLAIMED"
            : status.quest.completed
            ? "COMPLETE"
            : "IN PROGRESS",
          inline: true,
        }
      )
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
};
