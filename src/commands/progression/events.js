const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const globalEventService = require("../../services/globalEventService");
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
          "event-not-complete": "The event is still in progress.",
          "no-contribution":
            "You have not contributed to this event yet. Care actions and social actions contribute.",
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
    const command = new CommandContext();
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
        }
      )
      .setTimestamp();

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
};
