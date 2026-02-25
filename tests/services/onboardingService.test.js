jest.mock("../../src/services/progressionService", () => ({
  ensureProgress: jest.fn(),
}));

jest.mock("../../src/repositories/playerProgressRepository", () => ({
  saveProgress: jest.fn().mockResolvedValue({}),
}));

const progressionService = require("../../src/services/progressionService");
const playerProgressRepository = require("../../src/repositories/playerProgressRepository");
const onboardingService = require("../../src/services/onboardingService");

function buildProgress(seed = {}) {
  return {
    ...seed,
  };
}

describe("onboardingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers first adoption and starts first tutorial run", async () => {
    const progress = buildProgress();
    progressionService.ensureProgress.mockImplementation(async () => ({ progress }));
    const now = new Date("2026-02-22T12:00:00.000Z");

    const adoption = await onboardingService.registerAdoption("user-1", now);
    expect(adoption.ok).toBe(true);
    expect(adoption.isFirstAdoption).toBe(true);
    expect(adoption.status.adoptionCount).toBe(1);

    const start = await onboardingService.startTutorial("user-1", "first-adopt", now);
    expect(start.ok).toBe(true);
    expect(start.startedNew).toBe(true);
    expect(start.status.latestRun.status).toBe("active");
    expect(start.status.latestRun.nextRequiredStep).toBe("care");
    expect(playerProgressRepository.saveProgress).toHaveBeenCalled();
  });

  it("uses /pet as the first tutorial action and explains status commands", async () => {
    const progress = buildProgress();
    progressionService.ensureProgress.mockImplementation(async () => ({ progress }));
    const now = new Date("2026-02-22T12:10:00.000Z");

    const start = await onboardingService.startTutorial("user-1", "first-adopt", now);
    const prompt = onboardingService.getCurrentPrompt(start.status);

    expect(prompt.action).toBe("/pet");
    expect(prompt.content).toContain("**Tutorial 1/10 - Care System**");
    expect(prompt.content).toContain("**Action:**");
    expect(prompt.content).toContain("Available care commands:");
    expect(prompt.content).not.toContain("Lore:");
    expect(prompt.content).toContain("*Tip:*");
    expect(prompt.content).toContain("`/info` shows");
    expect(prompt.content).toContain("`/cooldowns` shows");
  });

  it("includes integrated context and bold action headers on each required step prompt", async () => {
    const progress = buildProgress();
    progressionService.ensureProgress.mockImplementation(async () => ({ progress }));
    const now = new Date("2026-02-22T12:15:00.000Z");

    const start = await onboardingService.startTutorial("user-lore", "first-adopt", now);
    const carePrompt = onboardingService.getCurrentPrompt(start.status);
    expect(carePrompt.content).toContain("**Tutorial 1/10 - Care System**");
    expect(carePrompt.content).toContain("**Action:**");
    expect(carePrompt.content).not.toContain("Lore:");
    expect(carePrompt.content).toContain("*Tip:*");

    const afterCare = await onboardingService.recordEvent(
      "user-lore",
      "care-action",
      { actionName: "pet" },
      now
    );
    const sleepPrompt = onboardingService.getCurrentPrompt(afterCare.status);
    expect(sleepPrompt.content).toContain("**Tutorial 2/10 - Sleep Schedule + World Events**");
    expect(sleepPrompt.content).toContain("**Action:**");
    expect(sleepPrompt.content).not.toContain("Lore:");
    expect(sleepPrompt.content).toContain("*Tip:*");

    const afterSleep = await onboardingService.recordEvent(
      "user-lore",
      "sleep-set",
      {},
      now
    );
    const trainPrompt = onboardingService.getCurrentPrompt(afterSleep.status);
    expect(trainPrompt.content).toContain("**Tutorial 3/10 - Training + Battle Power**");
    expect(trainPrompt.content).toContain("**Action:**");
    expect(trainPrompt.content).not.toContain("Lore:");
    expect(trainPrompt.content).toContain("*Tip:*");

    const afterTrain = await onboardingService.recordEvent(
      "user-lore",
      "training-action",
      { actionName: "train" },
      now
    );
    const parkSendPrompt = onboardingService.getCurrentPrompt(afterTrain.status);
    expect(parkSendPrompt.content).toContain("**Tutorial 4/10 - Park Send**");
    expect(parkSendPrompt.content).toContain("**Action:**");
    expect(parkSendPrompt.content).not.toContain("Lore:");
    expect(parkSendPrompt.content).toContain("*Tip:*");

    const afterParkSend = await onboardingService.recordEvent(
      "user-lore",
      "park-send",
      {},
      now
    );
    const parkLeavePrompt = onboardingService.getCurrentPrompt(afterParkSend.status);
    expect(parkLeavePrompt.content).toContain("**Tutorial 5/10 - Park Leave**");
    expect(parkLeavePrompt.content).toContain("**Action:**");
    expect(parkLeavePrompt.content).not.toContain("Lore:");
    expect(parkLeavePrompt.content).toContain("*Tip:*");

    const afterParkLeave = await onboardingService.recordEvent(
      "user-lore",
      "park-leave",
      {},
      now
    );
    const playdateSettingsPrompt = onboardingService.getCurrentPrompt(afterParkLeave.status);
    expect(playdateSettingsPrompt.content).toContain(
      "**Tutorial 6/10 - Playdate Preferences**"
    );
    expect(playdateSettingsPrompt.content).toContain("**Action:**");
    expect(playdateSettingsPrompt.content).toContain("*Tip:*");

    const afterPlaydateSettings = await onboardingService.recordEvent(
      "user-lore",
      "playdate-settings",
      { optIn: true },
      now
    );
    const playdatePrompt = onboardingService.getCurrentPrompt(afterPlaydateSettings.status);
    expect(playdatePrompt.content).toContain("**Tutorial 7/10 - Playdate**");
    expect(playdatePrompt.content).toContain("**Action:**");
    expect(playdatePrompt.content).toContain("*Tip:*");

    const afterPlaydate = await onboardingService.recordEvent(
      "user-lore",
      "playdate-action",
      { targetType: "npc", targetId: "npc-001" },
      now
    );
    const adventurePrompt = onboardingService.getCurrentPrompt(afterPlaydate.status);
    expect(adventurePrompt.content).toContain("**Tutorial 8/10 - Adventure System**");
    expect(adventurePrompt.content).toContain("**Action:**");
    expect(adventurePrompt.content).not.toContain("Lore:");
    expect(adventurePrompt.content).toContain("*Tip:*");

    const afterAdventure = await onboardingService.recordEvent(
      "user-lore",
      "adventure-start",
      {},
      now
    );
    const economyPrompt = onboardingService.getCurrentPrompt(afterAdventure.status);
    expect(economyPrompt.content).toContain("**Tutorial 9/10 - Economy System**");
    expect(economyPrompt.content).toContain("**Action:**");
    expect(economyPrompt.content).not.toContain("Lore:");
    expect(economyPrompt.content).toContain("*Tip:*");

    const afterEconomy = await onboardingService.recordEvent(
      "user-lore",
      "economy-interaction",
      { interaction: "daily" },
      now
    );
    const leaderboardPrompt = onboardingService.getCurrentPrompt(afterEconomy.status);
    expect(leaderboardPrompt.content).toContain("**Tutorial 10/10 - Leaderboard + Community**");
    expect(leaderboardPrompt.action).toBe("/leaderboard");
    expect(leaderboardPrompt.content).toContain("**Action:**");
    expect(leaderboardPrompt.content).toContain("*Tip:*");
  });

  it("includes a good luck message in completion recap", async () => {
    const progress = buildProgress();
    progressionService.ensureProgress.mockImplementation(async () => ({ progress }));
    const now = new Date("2026-02-22T12:20:00.000Z");

    await onboardingService.startTutorial("user-recap", "manual-start", now);
    await onboardingService.recordEvent(
      "user-recap",
      "care-action",
      { actionName: "pet" },
      now
    );
    await onboardingService.recordEvent("user-recap", "sleep-set", {}, now);
    await onboardingService.recordEvent(
      "user-recap",
      "training-action",
      { actionName: "train" },
      now
    );
    await onboardingService.recordEvent("user-recap", "park-send", {}, now);
    await onboardingService.recordEvent("user-recap", "park-leave", {}, now);
    await onboardingService.recordEvent(
      "user-recap",
      "playdate-settings",
      { optIn: true },
      now
    );
    await onboardingService.recordEvent(
      "user-recap",
      "playdate-action",
      { targetType: "npc", targetId: "npc-001" },
      now
    );
    await onboardingService.recordEvent("user-recap", "adventure-start", {}, now);
    await onboardingService.recordEvent(
      "user-recap",
      "economy-interaction",
      { interaction: "daily" },
      now
    );
    const completion = await onboardingService.recordEvent(
      "user-recap",
      "leaderboard-view",
      {},
      now
    );

    const recap = onboardingService.getCompletionRecap(completion.status);
    expect(recap.content).toContain("**Tutorial Complete**");
    expect(recap.content).toContain("**Good luck out there in Dream Land ♡**");
  });

  it("marks subsequent adoptions correctly", async () => {
    const progress = buildProgress({
      onboarding: {
        adoptionCount: 1,
      },
    });
    progressionService.ensureProgress.mockImplementation(async () => ({ progress }));
    const now = new Date("2026-02-22T13:00:00.000Z");

    const adoption = await onboardingService.registerAdoption("user-2", now);
    expect(adoption.ok).toBe(true);
    expect(adoption.isFirstAdoption).toBe(false);
    expect(adoption.status.adoptionCount).toBe(2);
  });

  it("completes required tutorial steps and marks run completed", async () => {
    const progress = buildProgress();
    progressionService.ensureProgress.mockImplementation(async () => ({ progress }));
    const now = new Date("2026-02-22T14:00:00.000Z");

    await onboardingService.startTutorial("user-3", "manual-start", now);
    await onboardingService.recordEvent(
      "user-3",
      "care-action",
      { actionName: "feed" },
      now
    );
    await onboardingService.recordEvent("user-3", "sleep-set", {}, now);
    await onboardingService.recordEvent(
      "user-3",
      "training-action",
      { actionName: "train" },
      now
    );
    await onboardingService.recordEvent("user-3", "park-send", {}, now);
    await onboardingService.recordEvent("user-3", "park-leave", {}, now);
    await onboardingService.recordEvent(
      "user-3",
      "playdate-settings",
      { optIn: true },
      now
    );
    await onboardingService.recordEvent(
      "user-3",
      "playdate-action",
      { targetType: "npc", targetId: "npc-001" },
      now
    );
    await onboardingService.recordEvent("user-3", "adventure-start", {}, now);
    await onboardingService.recordEvent(
      "user-3",
      "economy-interaction",
      { interaction: "daily" },
      now
    );
    const completion = await onboardingService.recordEvent(
      "user-3",
      "leaderboard-view",
      {},
      now
    );

    expect(completion.ok).toBe(true);
    expect(completion.completedNow).toBe(true);
    expect(completion.status.latestRun.status).toBe("completed");
    expect(completion.status.latestRun.requiredStepsCompleted).toBe(10);
  });

  it("honors out-of-order completion credits", async () => {
    const progress = buildProgress();
    progressionService.ensureProgress.mockImplementation(async () => ({ progress }));
    const now = new Date("2026-02-22T15:00:00.000Z");

    await onboardingService.startTutorial("user-4", "manual-start", now);
    await onboardingService.recordEvent("user-4", "adventure-start", {}, now);
    await onboardingService.recordEvent("user-4", "sleep-set", {}, now);

    const care = await onboardingService.recordEvent(
      "user-4",
      "care-action",
      { actionName: "feed" },
      now
    );

    expect(care.ok).toBe(true);
    expect(care.status.latestRun.nextRequiredStep).toBe("training");
    expect(
      care.status.latestRun.stepRows.find((step) => step.key === "adventure").completed
    ).toBe(true);
  });

  it("supports skipping active runs", async () => {
    const progress = buildProgress();
    progressionService.ensureProgress.mockImplementation(async () => ({ progress }));
    const now = new Date("2026-02-22T16:00:00.000Z");

    await onboardingService.startTutorial("user-5", "manual-start", now);
    const skip = await onboardingService.skipTutorial("user-5", "manual-skip", now);

    expect(skip.ok).toBe(true);
    expect(skip.status.latestRun.status).toBe("skipped");
    expect(skip.status.runsSkipped).toBe(1);
  });

  it("resets steps on replay", async () => {
    const progress = buildProgress();
    progressionService.ensureProgress.mockImplementation(async () => ({ progress }));
    const now = new Date("2026-02-22T17:00:00.000Z");

    await onboardingService.startTutorial("user-6", "manual-start", now);
    await onboardingService.recordEvent(
      "user-6",
      "care-action",
      { actionName: "feed" },
      now
    );
    await onboardingService.recordEvent("user-6", "sleep-set", {}, now);

    const replay = await onboardingService.startTutorial(
      "user-6",
      "manual-replay",
      now
    );
    const steps = replay.status.latestRun.stepRows;

    expect(replay.ok).toBe(true);
    expect(replay.startedNew).toBe(true);
    expect(steps.every((step) => step.completed === false)).toBe(true);
    expect(replay.status.latestRun.status).toBe("active");
  });
});
