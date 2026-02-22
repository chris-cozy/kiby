jest.mock("../../src/services/playerService", () => ({
  getPlayerByUserId: jest.fn(),
}));

jest.mock("../../src/services/sleepService", () => ({
  getScheduleForUser: jest.fn(),
  getSleepSummary: jest.fn(),
}));

jest.mock("../../src/services/onboardingService", () => ({
  recordEvent: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock("../../src/utils/interactionReply", () => ({
  safeDefer: jest.fn().mockResolvedValue(),
  safeReply: jest.fn().mockResolvedValue(),
}));

jest.mock("../../src/classes/command", () =>
  jest.fn().mockImplementation(() => ({
    pink: "#FF69B4",
  }))
);

const playerService = require("../../src/services/playerService");
const sleepService = require("../../src/services/sleepService");
const onboardingService = require("../../src/services/onboardingService");
const { safeReply } = require("../../src/utils/interactionReply");
const cooldownsCommand = require("../../src/commands/misc/cooldowns");

function buildInteraction() {
  return {
    user: {
      id: "user-1",
    },
  };
}

function buildClient() {
  return {
    user: {
      username: "Kiby",
      displayAvatarURL: () => "https://example.com/avatar.png",
    },
  };
}

describe("/cooldowns command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows only actions with active cooldowns", async () => {
    const nowMs = Date.UTC(2026, 1, 22, 18, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(nowMs);

    playerService.getPlayerByUserId.mockResolvedValue({
      kirbyName: "Nova",
      lastCare: {
        pet: new Date(nowMs - 7 * 60 * 1000),
        feed: new Date(nowMs - 1 * 60 * 1000),
        play: new Date(nowMs - 11 * 60 * 1000),
        cuddle: new Date(nowMs - 9 * 60 * 1000),
        train: new Date(nowMs - 5 * 60 * 1000),
        bathe: new Date(nowMs - 22 * 60 * 1000),
      },
    });
    sleepService.getScheduleForUser.mockResolvedValue({});
    sleepService.getSleepSummary.mockReturnValue({
      sleeping: false,
      remainingMs: 0,
    });

    await cooldownsCommand.callback(buildClient(), buildInteraction());

    const payload = safeReply.mock.calls[0][1];
    const fields = payload.embeds[0].data.fields;

    expect(fields.map((field) => field.name)).toEqual([
      "Sleep Status",
      "Feed",
      "Train",
    ]);
    expect(fields[1].value).toBe("0h 9m 0s");
    expect(fields[2].value).toBe("0h 10m 0s");
    expect(onboardingService.recordEvent).toHaveBeenCalledWith(
      "user-1",
      "cooldowns-view",
      {},
      expect.any(Date)
    );
  });

  it("shows no action rows when there are no active cooldowns", async () => {
    const nowMs = Date.UTC(2026, 1, 22, 18, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(nowMs);

    playerService.getPlayerByUserId.mockResolvedValue({
      kirbyName: "Nova",
      lastCare: {
        pet: new Date(nowMs - 9 * 60 * 1000),
        feed: new Date(nowMs - 20 * 60 * 1000),
        play: new Date(nowMs - 20 * 60 * 1000),
        cuddle: new Date(nowMs - 20 * 60 * 1000),
        train: new Date(nowMs - 20 * 60 * 1000),
        bathe: new Date(nowMs - 30 * 60 * 1000),
      },
    });
    sleepService.getScheduleForUser.mockResolvedValue({});
    sleepService.getSleepSummary.mockReturnValue({
      sleeping: true,
      remainingMs: 60 * 60 * 1000,
    });

    await cooldownsCommand.callback(buildClient(), buildInteraction());

    const payload = safeReply.mock.calls[0][1];
    const embed = payload.embeds[0].data;

    expect(embed.description).toContain("No active cooldown timers");
    expect(embed.description).toContain("only `/pet` and `/cuddle` are available");
    expect(embed.fields.map((field) => field.name)).toEqual(["Sleep Status"]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
