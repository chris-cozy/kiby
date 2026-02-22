jest.mock("../../src/services/playerService", () => ({
  adoptPlayer: jest.fn(),
}));

jest.mock("../../src/services/onboardingService", () => ({
  registerAdoption: jest.fn(),
  startTutorial: jest.fn(),
}));

jest.mock("../../src/utils/interactionReply", () => ({
  safeDefer: jest.fn().mockResolvedValue(),
  safeReply: jest.fn().mockResolvedValue(),
}));

jest.mock("../../src/utils/tutorialFollowUp", () => ({
  safeTutorialFollowUp: jest.fn().mockResolvedValue(true),
  sendTutorialPromptForStatus: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../src/classes/command", () =>
  jest.fn().mockImplementation(() => ({
    pink: "#FF69B4",
    get_media_attachment: jest.fn().mockResolvedValue({
      mediaString: "attachment://adopt.png",
      mediaAttach: { name: "adopt.png" },
    }),
  }))
);

const playerService = require("../../src/services/playerService");
const onboardingService = require("../../src/services/onboardingService");
const { safeReply } = require("../../src/utils/interactionReply");
const {
  safeTutorialFollowUp,
  sendTutorialPromptForStatus,
} = require("../../src/utils/tutorialFollowUp");
const adoptCommand = require("../../src/commands/config/adopt");

function buildInteraction(name = "Nova") {
  return {
    user: {
      id: "user-1",
      username: "Tester",
      displayAvatarURL: () => "https://example.com/avatar.png",
    },
    options: {
      get: () => ({ value: name }),
    },
    followUp: jest.fn().mockResolvedValue({}),
  };
}

describe("/adopt command onboarding behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("auto-starts tutorial for first adoption", async () => {
    playerService.adoptPlayer.mockResolvedValue({
      created: true,
      player: { kirbyName: "Nova" },
    });
    onboardingService.registerAdoption.mockResolvedValue({
      ok: true,
      isFirstAdoption: true,
    });
    onboardingService.startTutorial.mockResolvedValue({
      ok: true,
      status: { latestRun: { status: "active" } },
    });

    await adoptCommand.callback({ user: { username: "Kiby", displayAvatarURL: () => "" } }, buildInteraction());

    expect(onboardingService.registerAdoption).toHaveBeenCalledWith(
      "user-1",
      expect.any(Date)
    );
    expect(onboardingService.startTutorial).toHaveBeenCalledWith(
      "user-1",
      "first-adopt",
      expect.any(Date)
    );
    expect(safeTutorialFollowUp).toHaveBeenCalledWith(
      expect.any(Object),
      "Welcome to Dream Land! Let's walk through how to take care of a Kiby"
    );
    expect(sendTutorialPromptForStatus).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    );
    expect(safeReply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        embeds: expect.any(Array),
      })
    );
    const adoptPayload = safeReply.mock.calls[0][1];
    expect(adoptPayload.embeds[0].data.fields).toBeUndefined();
  });

  it("prompts rerun message for subsequent adoptions", async () => {
    playerService.adoptPlayer.mockResolvedValue({
      created: true,
      player: { kirbyName: "Nova" },
    });
    onboardingService.registerAdoption.mockResolvedValue({
      ok: true,
      isFirstAdoption: false,
    });

    await adoptCommand.callback({ user: { username: "Kiby", displayAvatarURL: () => "" } }, buildInteraction());

    expect(onboardingService.startTutorial).not.toHaveBeenCalled();
    expect(safeTutorialFollowUp).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining("`/tutorial start`")
    );
  });
});
