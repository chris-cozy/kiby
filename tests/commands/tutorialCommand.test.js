jest.mock("../../src/utils/interactionReply", () => ({
  safeDefer: jest.fn().mockResolvedValue(),
  safeReply: jest.fn().mockResolvedValue(),
}));

jest.mock("../../src/services/onboardingService", () => ({
  getStatus: jest.fn(),
  skipTutorial: jest.fn(),
  startTutorial: jest.fn(),
  getCurrentPrompt: jest.fn(),
}));

jest.mock("../../src/utils/tutorialFollowUp", () => ({
  sendTutorialPromptForStatus: jest.fn().mockResolvedValue(true),
}));

const { safeDefer, safeReply } = require("../../src/utils/interactionReply");
const onboardingService = require("../../src/services/onboardingService");
const { sendTutorialPromptForStatus } = require("../../src/utils/tutorialFollowUp");
const tutorialCommand = require("../../src/commands/misc/tutorial");

function buildInteraction(subcommand) {
  return {
    user: { id: "user-1" },
    options: {
      getSubcommand: () => subcommand,
    },
  };
}

describe("/tutorial command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns status output for /tutorial status", async () => {
    onboardingService.getStatus.mockResolvedValue({
      ok: true,
      status: {
        latestRun: {
          status: "active",
          requiredStepsCompleted: 1,
          requiredStepsTotal: 5,
          stepRows: [
            { key: "care", label: "Care System", required: true, completed: true },
            { key: "sleep", label: "Sleep", required: true, completed: false },
          ],
        },
      },
    });
    onboardingService.getCurrentPrompt.mockReturnValue({ action: "/sleep schedule set" });

    await tutorialCommand.callback({}, buildInteraction("status"));

    expect(safeDefer).toHaveBeenCalledWith(expect.any(Object), { ephemeral: true });
    expect(onboardingService.getStatus).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        content: expect.stringContaining("Tutorial status: **ACTIVE**"),
      })
    );
  });

  it("starts tutorial and emits prompt on /tutorial start", async () => {
    onboardingService.startTutorial.mockResolvedValue({
      ok: true,
      startedNew: true,
      status: { latestRun: { status: "active" } },
    });

    await tutorialCommand.callback({}, buildInteraction("start"));

    expect(onboardingService.startTutorial).toHaveBeenCalledWith(
      "user-1",
      "manual-start",
      expect.any(Date)
    );
    expect(sendTutorialPromptForStatus).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("skips active tutorial on /tutorial skip", async () => {
    onboardingService.skipTutorial.mockResolvedValue({
      ok: true,
      status: { latestRun: { status: "skipped" } },
    });

    await tutorialCommand.callback({}, buildInteraction("skip"));

    expect(onboardingService.skipTutorial).toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        content: expect.stringContaining("Tutorial skipped"),
      })
    );
  });

  it("replays tutorial from step 1", async () => {
    onboardingService.startTutorial.mockResolvedValue({
      ok: true,
      startedNew: true,
      status: { latestRun: { status: "active" } },
    });

    await tutorialCommand.callback({}, buildInteraction("replay"));

    expect(onboardingService.startTutorial).toHaveBeenCalledWith(
      "user-1",
      "manual-replay",
      expect.any(Date)
    );
    expect(sendTutorialPromptForStatus).toHaveBeenCalled();
  });
});
