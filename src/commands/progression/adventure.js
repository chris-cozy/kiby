const {
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const CommandContext = require("../../classes/command");
const adventureService = require("../../services/adventureService");
const economyService = require("../../services/economyService");
const languageService = require("../../services/languageService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

const ROUTE_CHOICES = adventureService.ROUTES.map((route) => ({
  name: route.label,
  value: route.id,
}));

const DURATION_CHOICES = adventureService.DURATION_OPTIONS_MINUTES.map((minutes) => ({
  name: `${minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}`,
  value: minutes,
}));

const SUPPORT_CHOICES = economyService.listItemsByContext("adventure").map((item) => ({
  name: item.label,
  value: item.id,
}));

function formatEtaWindow(run) {
  const earliest = new Date(run.earliestResolveAt).toLocaleString("en-US");
  const latest = new Date(run.latestResolveAt).toLocaleString("en-US");
  return `${earliest} - ${latest}`;
}

module.exports = {
  name: "adventure",
  description: "Send your Kiby on asynchronous adventures.",
  deleted: false,
  options: [
    {
      name: "start",
      description: "Start a new adventure run.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "route",
          description: "Adventure route",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: ROUTE_CHOICES,
        },
        {
          name: "duration",
          description: "Adventure duration baseline estimate",
          type: ApplicationCommandOptionType.Integer,
          required: true,
          choices: DURATION_CHOICES,
        },
        {
          name: "support_item",
          description: "Optional support item for this run",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: SUPPORT_CHOICES,
        },
      ],
    },
    {
      name: "status",
      description: "View current adventure status.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "claim",
      description: "Claim a finished adventure.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "locations",
      description: "List adventure locations and active Kiby counts.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "locations") {
      const routes = await adventureService.listAdventureLocations(new Date());
      const command = new CommandContext();
      const embed = new EmbedBuilder()
        .setTitle("Adventure Locations")
        .setColor(command.pink)
        .setDescription(
          routes
            .map(
              (route) =>
                `**${route.routeLabel}** | Rec BP: **${route.recommendedBattlePower}** | Adventuring: **${route.activeCount}**`
            )
            .join("\n\n")
        )
        .setTimestamp();

      await safeReply(interaction, {
        embeds: [embed],
        ephemeral: true,
      });
      return;
    }

    if (subcommand === "status") {
      const status = await adventureService.getAdventureStatus(
        interaction.user.id,
        new Date()
      );
      const command = new CommandContext();

      if (!status.run) {
        await safeReply(interaction, {
          content: "No active adventure. Use `/adventure start`.",
          ephemeral: true,
        });
        return;
      }

      const run = status.run;
      const flavor = await languageService.buildAdventureLineForUser(
        interaction.user.id,
        "status",
        new Date()
      );
      const embed = new EmbedBuilder()
        .setTitle("Adventure Status")
        .setColor(command.pink)
        .setImage(run.routeImageUrl || null)
        .addFields(
          {
            name: "Route",
            value: run.routeLabel,
            inline: true,
          },
          {
            name: "Recommended BP",
            value: `${run.recommendedBattlePower}`,
            inline: true,
          },
          {
            name: "Risk",
            value: run.riskBand,
            inline: true,
          },
          {
            name: "Preparedness",
            value: `${Math.round(run.preparednessScore * 100)}%`,
            inline: true,
          },
          {
            name: "Support Item",
            value: run.supportItemLabel || "None",
            inline: true,
          },
          {
            name: "Resolution",
            value:
              run.status === "active"
                ? `In progress (${Math.max(1, Math.ceil(run.msRemaining / 60000))}m remaining)`
                : run.status.toUpperCase(),
            inline: true,
          },
          {
            name: "ETA Window",
            value: formatEtaWindow(run),
            inline: false,
          },
          {
            name: "Projected Rewards",
            value: `${run.rewardCoins} coins, ${run.rewardXp} XP`,
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
        embeds: [embed],
        ephemeral: true,
      });
      return;
    }

    if (subcommand === "claim") {
      const claim = await adventureService.claimAdventure(
        interaction.user.id,
        new Date()
      );
      if (!claim.ok) {
        const map = {
          "missing-run": "You do not have an active adventure.",
          "missing-player": "You need an active Kiby to claim adventure rewards.",
          "not-ready": "Your adventure is still in progress.",
          "already-claimed": "This adventure was already claimed.",
        };
        await safeReply(interaction, {
          content: map[claim.reason] || "Could not claim adventure right now.",
          ephemeral: true,
        });
        return;
      }

      const command = new CommandContext();
      const flavor = await languageService.buildAdventureLineForUser(
        interaction.user.id,
        claim.status === "failed" ? "failed" : "success",
        new Date()
      );
      const itemsLine =
        Object.entries(claim.rewardItems || {})
          .map(([itemId, qty]) => `${itemId} x${qty}`)
          .join(", ") || "none";
      const embed = new EmbedBuilder()
        .setTitle(claim.status === "failed" ? "Adventure Failed" : "Adventure Complete")
        .setColor(command.pink)
        .setImage(claim.routeImageUrl || null)
        .setDescription(
          claim.status === "failed"
            ? `**${claim.routeLabel}** ended early. Your Kiby needs recovery before another risky trip.`
            : `**${claim.routeLabel}** was successfully cleared.`
        )
        .addFields(
          {
            name: "Damage Taken",
            value: `${claim.damageTaken}`,
            inline: true,
          },
          {
            name: "Coins",
            value: `${claim.rewardCoins}`,
            inline: true,
          },
          {
            name: "XP",
            value: `${claim.rewardXp}`,
            inline: true,
          },
          {
            name: "Items",
            value: itemsLine,
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
        embeds: [embed],
        ephemeral: true,
      });
      return;
    }

    const routeId = interaction.options.getString("route", true);
    const duration = interaction.options.getInteger("duration", true);
    const supportItem = interaction.options.getString("support_item") || "";
    const start = await adventureService.startAdventure(
      interaction.user.id,
      {
        routeId,
        durationMinutes: duration,
        supportItemId: supportItem,
      },
      new Date()
    );

    if (!start.ok) {
      const map = {
        "missing-player": "You need an active Kiby to start adventures.",
        "unknown-route": "That route is not available.",
        "invalid-duration": "Choose one of the preset duration options.",
        "already-active": "You already have an active adventure.",
        "claim-required":
          "Your previous adventure is ready. Use `/adventure claim` before starting another.",
        "missing-item": "You do not have that support item.",
        "unknown-item": "Support item not found.",
        "invalid-support-item": "That item cannot be used as adventure support.",
      };
      await safeReply(interaction, {
        content: map[start.reason] || "Could not start adventure.",
        ephemeral: true,
      });
      return;
    }

    const command = new CommandContext();
    const run = start.run;
    const flavor = await languageService.buildAdventureLineForUser(
      interaction.user.id,
      "start",
      new Date()
    );
    const embed = new EmbedBuilder()
      .setTitle("Adventure Started")
      .setColor(command.pink)
      .setImage(run.routeImageUrl || null)
      .setDescription(
        `Route: **${run.routeLabel}** | Baseline: **${run.baselineDurationMinutes}m**`
      )
      .addFields(
        {
          name: "Recommended BP",
          value: `${run.recommendedBattlePower}`,
          inline: true,
        },
        {
          name: "Risk Band",
          value: run.riskBand,
          inline: true,
        },
        {
          name: "Preparedness",
          value: `${Math.round(run.preparednessScore * 100)}%`,
          inline: true,
        },
        {
          name: "Support Item",
          value: run.supportItemLabel || "None",
          inline: true,
        },
        {
          name: "ETA Window",
          value: formatEtaWindow(run),
          inline: false,
        },
        {
          name: "Kiby Signal",
          value: flavor,
          inline: false,
        }
      )
      .setTimestamp();

    if ((start.bpDecayApplied || 0) > 0) {
      embed.addFields({
        name: "BP Decay Applied",
        value: `-${start.bpDecayApplied} battle power from inactivity.`,
        inline: false,
      });
    }

    await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
};
