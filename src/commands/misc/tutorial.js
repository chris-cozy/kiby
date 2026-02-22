const { ApplicationCommandOptionType } = require("discord.js");
const onboardingService = require("../../services/onboardingService");
const {
  safeDefer,
  safeReply,
} = require("../../utils/interactionReply");
const {
  sendTutorialPromptForStatus,
} = require("../../utils/tutorialFollowUp");

function formatTutorialStatus(statusPayload) {
  const status = statusPayload?.status || statusPayload;
  const run = status.latestRun;
  const lines = [];

  lines.push(`Tutorial status: **${run.status.toUpperCase()}**`);
  lines.push(
    `Required progress: **${run.requiredStepsCompleted}/${run.requiredStepsTotal}**`
  );
  lines.push("Checklist:");
  for (const row of run.stepRows) {
    lines.push(
      `${row.completed ? "✅" : "⬜"} ${row.label}${row.required ? "" : " (Optional)"}`
    );
  }

  if (run.status === "active") {
    const prompt = onboardingService.getCurrentPrompt(status);
    lines.push(
      `Next action: **${prompt?.action || "Finish the current step"}**`
    );
    lines.push("Use `/tutorial skip` to exit anytime.");
  } else {
    lines.push("Use `/tutorial replay` to run it again.");
  }

  return lines.join("\n");
}

module.exports = {
  name: "tutorial",
  description: "Start, review, skip, or replay the Kiby onboarding tutorial.",
  deleted: false,
  options: [
    {
      name: "start",
      description: "Start a tutorial run or resume your active run.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "status",
      description: "View tutorial progress and next action.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "skip",
      description: "Skip the active tutorial run.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "replay",
      description: "Restart tutorial from step 1.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    const now = new Date();

    if (subcommand === "status") {
      const result = await onboardingService.getStatus(interaction.user.id, now);
      await safeReply(interaction, {
        content: formatTutorialStatus(result.status),
        ephemeral: true,
      });
      return;
    }

    if (subcommand === "skip") {
      const result = await onboardingService.skipTutorial(
        interaction.user.id,
        "manual-skip",
        now
      );
      if (!result.ok) {
        await safeReply(interaction, {
          content: "No active tutorial run. Use `/tutorial start` to begin.",
          ephemeral: true,
        });
        return;
      }

      await safeReply(interaction, {
        content: "Tutorial skipped. Use `/tutorial replay` whenever you want it again.",
        ephemeral: true,
      });
      return;
    }

    if (subcommand === "replay") {
      const result = await onboardingService.startTutorial(
        interaction.user.id,
        "manual-replay",
        now
      );
      await safeReply(interaction, {
        content: "Tutorial restarted from step 1.",
        ephemeral: true,
      });
      await sendTutorialPromptForStatus(interaction, result.status);
      return;
    }

    const result = await onboardingService.startTutorial(
      interaction.user.id,
      "manual-start",
      now
    );

    await safeReply(interaction, {
      content: result.startedNew
        ? "Tutorial started."
        : "Tutorial resumed.",
      ephemeral: true,
    });
    await sendTutorialPromptForStatus(interaction, result.status);
  },
};
