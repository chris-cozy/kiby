jest.mock("../../src/config/env", () => ({
  socialReceiveCooldownMinutes: 45,
}));

jest.mock("../../src/repositories/playerRepository", () => ({
  findByUserId: jest.fn(),
  savePlayer: jest.fn(),
}));

jest.mock("../../src/services/progressionService", () => ({
  registerOneWaySocialTarget: jest.fn(),
  recordSocialAction: jest.fn(),
}));

jest.mock("../../src/services/globalEventService", () => ({
  recordContribution: jest.fn(),
}));

const playerRepository = require("../../src/repositories/playerRepository");
const progressionService = require("../../src/services/progressionService");
const globalEventService = require("../../src/services/globalEventService");
const socialService = require("../../src/services/socialService");

describe("socialService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks /social interact when receiver cooldown is active", async () => {
    const now = new Date("2026-02-18T12:00:00.000Z");
    const sender = {
      userId: "sender",
      social: 50,
      lastCare: {
        socialPlay: new Date("2026-02-18T10:00:00.000Z"),
      },
    };
    const target = {
      userId: "target",
      socialOptIn: true,
      lastCare: {
        socialReceived: new Date("2026-02-18T11:30:00.000Z"),
      },
    };

    playerRepository.findByUserId
      .mockResolvedValueOnce(sender)
      .mockResolvedValueOnce(target);

    const result = await socialService.interactWithPlayerKiby(
      "sender",
      "target",
      "cheer",
      now
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("target-cooldown");
    expect(result.waitMs).toBeGreaterThan(0);
    expect(playerRepository.savePlayer).not.toHaveBeenCalled();
  });

  it("applies sender and target gains and stamps socialReceived on success", async () => {
    const now = new Date("2026-02-18T12:00:00.000Z");
    const sender = {
      userId: "sender",
      social: 50,
      lastCare: {
        socialPlay: new Date("2026-02-18T10:00:00.000Z"),
      },
    };
    const target = {
      userId: "target",
      kirbyName: "Nova",
      socialOptIn: true,
      affection: 40,
      social: 30,
      lastCare: {
        socialReceived: new Date("2026-02-18T10:00:00.000Z"),
      },
    };

    playerRepository.findByUserId
      .mockResolvedValueOnce(sender)
      .mockResolvedValueOnce(target);
    playerRepository.savePlayer.mockResolvedValue({});
    progressionService.recordSocialAction.mockResolvedValue({});
    globalEventService.recordContribution.mockResolvedValue({});

    const result = await socialService.interactWithPlayerKiby(
      "sender",
      "target",
      "cheer",
      now
    );

    expect(result.ok).toBe(true);
    expect(result.senderGain).toBe(6);
    expect(result.targetAffectionGain).toBe(4);
    expect(result.targetSocialGain).toBe(3);
    expect(target.lastCare.socialReceived.toISOString()).toBe(now.toISOString());
    expect(playerRepository.savePlayer).toHaveBeenCalledTimes(2);
  });
});
