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
      options: [
        {
          name: "quest",
          description: "Quest slot to claim (defaults to first completed).",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: "Quest 1", value: "slot-1" },
            { name: "Quest 2", value: "slot-2" },
            { name: "Quest 3", value: "slot-3" },
            { name: "Bonus", value: "bonus" },
          ],
        },
      ],
    },
    {
      name: "reroll",
      description: "Reroll one daily quest (1 free reroll per day).",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "slot",
          description: "Quest slot to reroll",
          type: ApplicationCommandOptionType.Integer,
          required: true,
          min_value: 1,
          max_value: 3,
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
    if (subcommand === "claim") {
      const selector = interaction.options.getString("quest") || undefined;
      const claim = await progressionService.claimQuestReward(
        interaction.user.id,
        selector,
        new Date()
      );
      if (!claim.ok) {
        await safeReply(interaction, {
          content:
            claim.reason === "quest-not-found"
              ? "That quest slot is not valid."
              : claim.reason === "quest-incomplete"
              ? "Quest is not complete yet."
              : "Quest reward already claimed today.",
          ephemeral: true,
        });
        return;
      }

      await safeReply(interaction, {
        content: `Quest reward claimed: **${claim.reward} Star Coins** from **${claim.quest.label}**.`,
        ephemeral: true,
      });
      return;
    }

    if (subcommand === "reroll") {
      const slot = interaction.options.getInteger("slot", true);
      const reroll = await progressionService.rerollQuest(
        interaction.user.id,
        slot,
        new Date()
      );
      if (!reroll.ok) {
        await safeReply(interaction, {
          content:
            reroll.reason === "no-rerolls"
              ? "You have no rerolls left today."
              : "Invalid quest slot.",
          ephemeral: true,
        });
        return;
      }

      await safeReply(interaction, {
        content: `Rerolled slot **${reroll.slot}** into **${reroll.quest.label}** (${reroll.quest.goal} goal). Rerolls left: **${reroll.rerollsRemaining}**.`,
        ephemeral: true,
      });
      return;
    }

    const status = await progressionService.getQuestStatus(interaction.user.id);
    const command = new CommandContext();

    const fields = [];
    for (const quest of status.quests) {
      fields.push({
        name: `${quest.id.toUpperCase()} - ${quest.label}`,
        value: `${quest.progress}/${quest.goal} | Reward: ${quest.rewardCoins} coins | ${
          quest.claimed ? "CLAIMED" : quest.completed ? "COMPLETE" : "IN PROGRESS"
        }`,
        inline: false,
      });
    }
    fields.push({
      name: `BONUS - ${status.bonusQuest.label}`,
      value: `${status.bonusQuest.progress}/${status.bonusQuest.goal} | Reward: ${status.bonusQuest.rewardCoins} coins | ${
        status.bonusQuest.claimed
          ? "CLAIMED"
          : status.bonusQuest.completed
          ? "COMPLETE"
          : "IN PROGRESS"
      }`,
      inline: false,
    });
    fields.push({
      name: "Reset",
      value: `Local timezone: ${status.timezone}\nResets in: ${Math.max(
        1,
        Math.floor(status.resetInSeconds / 60)
      )}m`,
      inline: false,
    });

    const embed = new EmbedBuilder()
      .setTitle("Daily Quests")
      .setColor(command.pink)
      .setDescription(
        `Current streak: **${status.dailyStreak}** day(s) | Streak Shield: **${status.streakShieldCharges}** | Rerolls left: **${status.rerollsRemaining}**`
      )
      .addFields(fields)
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
};
