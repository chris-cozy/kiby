jest.mock("../../src/services/leaderboardService", () => ({
  getLeaderboard: jest.fn(),
}));

jest.mock("../../src/config/env", () => ({
  devUserIds: ["dev-user"],
}));

jest.mock("../../src/utils/interactionReply", () => ({
  safeDefer: jest.fn().mockResolvedValue(),
  safeReply: jest.fn().mockResolvedValue(),
}));

jest.mock("../../src/utils/tutorialFollowUp", () => ({
  recordTutorialEventAndFollowUp: jest.fn().mockResolvedValue({
    ok: true,
    changed: true,
  }),
}));

jest.mock("../../src/classes/command", () =>
  jest.fn().mockImplementation(() => ({
    pink: "#FF69B4",
  }))
);

const leaderboardService = require("../../src/services/leaderboardService");
const { safeReply } = require("../../src/utils/interactionReply");
const {
  recordTutorialEventAndFollowUp,
} = require("../../src/utils/tutorialFollowUp");
const leaderboardCommand = require("../../src/commands/misc/leaderboard");

function buildClient() {
  return {};
}

function buildInteraction({ userId = "user-1", mode = null, count = null } = {}) {
  return {
    user: {
      id: userId,
      username: "Tester",
      displayAvatarURL: () => "https://example.com/avatar.png",
    },
    options: {
      getString: () => mode,
      getInteger: () => count,
    },
  };
}

describe("/leaderboard command tutorial hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records leaderboard tutorial event on successful leaderboard view", async () => {
    leaderboardService.getLeaderboard.mockResolvedValue({
      mode: "total",
      total: 1,
      top: [
        {
          type: "player",
          userId: "user-1",
          kirbyName: "Nova",
          titleLabel: "",
          level: 4,
          xp: 12,
        },
      ],
    });

    await leaderboardCommand.callback(buildClient(), buildInteraction());

    expect(safeReply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        embeds: expect.any(Array),
      })
    );
    expect(recordTutorialEventAndFollowUp).toHaveBeenCalledWith(
      expect.any(Object),
      "user-1",
      "leaderboard-view",
      {},
      expect.any(Date)
    );
  });

  it("does not record tutorial event when restricted players mode is denied", async () => {
    await leaderboardCommand.callback(
      buildClient(),
      buildInteraction({ userId: "user-1", mode: "players" })
    );

    expect(leaderboardService.getLeaderboard).not.toHaveBeenCalled();
    expect(recordTutorialEventAndFollowUp).not.toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        content: "Players-only leaderboard mode is restricted to developers.",
        ephemeral: true,
      })
    );
  });
});
