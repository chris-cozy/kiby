const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const globalEventService = require("../../services/globalEventService");
const languageService = require("../../services/languageService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "events",
  description: "View and claim global campaign event rewards.",
  deleted: false,
  options: [
    {
      name: "view",
      description: "View the active global event.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "claim",
      description: "Claim your global event reward if eligible.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "claim") {
      const claim = await globalEventService.claimGlobalEventReward(
        interaction.user.id,
        new Date()
      );
      if (!claim.ok) {
        const map = {
          "no-active-event":
            "No global event is active right now. Check back after the next event window opens.",
          "event-not-complete": "The event is still in progress.",
          "no-contribution":
            "You have not contributed to this event yet. Care, social, and adventure actions contribute.",
          "already-claimed": "You already claimed this event reward.",
        };
        await safeReply(interaction, {
          content: map[claim.reason] || "Could not claim event reward.",
          ephemeral: true,
        });
        return;
      }

      await safeReply(interaction, {
        content: `Claimed global event rewards: **${claim.rewardCoins} Star Coins**${
          claim.rewardXp ? ` and **${claim.rewardXp} XP**` : ""
        }.`,
        ephemeral: true,
      });
      return;
    }

    const status = await globalEventService.getGlobalEventStatus(
      interaction.user.id,
      new Date()
    );
    const flavor = await languageService.buildGlobalEventLineForUser(
      interaction.user.id,
      new Date()
    );
    const command = new CommandContext();
    if (!status.active) {
      const idleEmbed = new EmbedBuilder()
        .setTitle("Global Event: Idle")
        .setColor(command.pink)
        .setDescription(
          "No global event is currently active."
        )
        .addFields(
          {
            name: "Next Eligible Start",
            value: new Date(status.nextEligibleAt).toLocaleString("en-US"),
            inline: false,
          },
          {
            name: "Cadence",
            value: `Duration: ${status.durationRangeHours[0]}-${status.durationRangeHours[1]}h | Quiet Gap: ${status.idleGapRangeHours[0]}-${status.idleGapRangeHours[1]}h`,
            inline: false,
          },
          {
            name: "Start Chance Per Tick",
            value: `${status.startChancePerTickPercent}%`,
            inline: false,
          },
          {
            name: "Kiby Signal",
            value: flavor,
            inline: false,
          }
        )
        .setTimestamp();

      await safeReply(interaction, {
        embeds: [idleEmbed],
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`Global Event: ${status.title}`)
      .setColor(command.pink)
      .setDescription(status.description)
      .addFields(
        {
          name: "Progress",
          value: `${status.progress}/${status.goal}`,
          inline: true,
        },
        {
          name: "Your Contribution",
          value: `${status.contribution}`,
          inline: true,
        },
        {
          name: "Status",
          value: status.completed ? "COMPLETE" : "IN PROGRESS",
          inline: true,
        },
        {
          name: "Ends",
          value: `${new Date(status.endsAt).toLocaleString("en-US")}`,
          inline: false,
        },
        {
          name: "Kiby Signal",
          value: flavor,
          inline: false,
        }
      )
      .setTimestamp();

    if (status.scalingSnapshot) {
      embed.addFields({
        name: "Scaled Goal",
        value: `Active(24h): ${status.scalingSnapshot.activePlayers} | Target/Active: ${status.scalingSnapshot.targetPerActive} | Multiplier: ${status.scalingSnapshot.goalMultiplier}`,
        inline: false,
      });
    }

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
};
