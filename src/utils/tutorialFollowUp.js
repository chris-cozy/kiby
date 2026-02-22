const onboardingService = require("../services/onboardingService");

async function safeTutorialFollowUp(interaction, content) {
  if (!interaction || typeof interaction.followUp !== "function") {
    return false;
  }

  try {
    await interaction.followUp({
      content,
      ephemeral: true,
    });
    return true;
  } catch {
    return false;
  }
}

async function sendTutorialPromptForStatus(interaction, statusPayload) {
  const prompt = onboardingService.getCurrentPrompt(statusPayload);
  if (!prompt) {
    return false;
  }

  return safeTutorialFollowUp(interaction, prompt.content);
}

async function sendTutorialRecapForStatus(interaction, statusPayload) {
  const recap = onboardingService.getCompletionRecap(statusPayload);
  if (!recap) {
    return false;
  }

  return safeTutorialFollowUp(interaction, recap.content);
}

async function recordTutorialEventAndFollowUp(
  interaction,
  userId,
  eventKey,
  payload = {},
  now = new Date()
) {
  try {
    const result = await onboardingService.recordEvent(
      userId,
      eventKey,
      payload,
      now
    );

    if (!result.ok || !result.changed) {
      return result;
    }

    if (result.completedNow) {
      const sent = await sendTutorialRecapForStatus(interaction, result.status);
      if (sent) {
        await onboardingService.recordEvent(userId, "recap-shown", {}, now);
      }
      return result;
    }

    if (result.shouldPrompt) {
      await sendTutorialPromptForStatus(interaction, result.status);
    }

    return result;
  } catch {
    return {
      ok: false,
      changed: false,
      shouldPrompt: false,
      completedNow: false,
    };
  }
}

async function followUpFromTutorialUpdate(
  interaction,
  userId,
  tutorialUpdate,
  now = new Date()
) {
  if (!tutorialUpdate || !tutorialUpdate.ok || !tutorialUpdate.changed) {
    return tutorialUpdate;
  }

  if (tutorialUpdate.completedNow) {
    const sent = await sendTutorialRecapForStatus(interaction, tutorialUpdate.status);
    if (sent) {
      await onboardingService.recordEvent(userId, "recap-shown", {}, now);
    }
    return tutorialUpdate;
  }

  if (tutorialUpdate.shouldPrompt) {
    await sendTutorialPromptForStatus(interaction, tutorialUpdate.status);
  }

  return tutorialUpdate;
}

module.exports = {
  followUpFromTutorialUpdate,
  recordTutorialEventAndFollowUp,
  safeTutorialFollowUp,
  sendTutorialPromptForStatus,
  sendTutorialRecapForStatus,
};
