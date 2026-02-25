jest.mock("../../src/repositories/playerRepository", () => ({
  findByUserId: jest.fn(),
  savePlayer: jest.fn(),
}));

jest.mock("../../src/repositories/playerAdventureRepository", () => ({
  findByUserId: jest.fn(),
}));

jest.mock("../../src/repositories/playerParkRepository", () => ({
  countActive: jest.fn(),
  findByUserId: jest.fn(),
  listReadyForAutoReturn: jest.fn(),
  savePlayerPark: jest.fn(),
  upsertByUserId: jest.fn(),
}));

jest.mock("../../src/services/progressionService", () => ({
  recordSocialAction: jest.fn(),
}));

jest.mock("../../src/services/globalEventService", () => ({
  recordContribution: jest.fn(),
}));

const playerRepository = require("../../src/repositories/playerRepository");
const playerAdventureRepository = require("../../src/repositories/playerAdventureRepository");
const playerParkRepository = require("../../src/repositories/playerParkRepository");
const progressionService = require("../../src/services/progressionService");
const globalEventService = require("../../src/services/globalEventService");
const parkService = require("../../src/services/parkService");

describe("parkService", () => {
  let mathRandomSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    mathRandomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    mathRandomSpy.mockRestore();
  });

  it("rejects unsupported duration values", async () => {
    const result = await parkService.sendToPark("user-1", 999, new Date());

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("invalid-duration");
  });

  it("blocks park send while user is adventuring", async () => {
    const now = new Date("2026-02-24T10:00:00.000Z");
    playerRepository.findByUserId.mockResolvedValue({
      userId: "user-1",
    });
    playerParkRepository.upsertByUserId.mockResolvedValue({
      userId: "user-1",
      activeSession: null,
    });
    playerAdventureRepository.findByUserId.mockResolvedValue({
      activeRun: {
        claimedAt: null,
        resolvedAt: new Date("2026-02-24T10:20:00.000Z"),
      },
    });

    const result = await parkService.sendToPark("user-1", 30, now);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("adventuring");
  });

  it("applies proportional effects when leaving early", async () => {
    const now = new Date("2026-02-24T10:30:00.000Z");
    const player = {
      userId: "user-1",
      social: 50,
      hunger: 80,
      lastCare: {
        socialPlay: new Date("2026-02-24T09:00:00.000Z"),
      },
    };
    const record = {
      userId: "user-1",
      activeSession: {
        startedAt: new Date("2026-02-24T10:00:00.000Z"),
        resolvedAt: new Date("2026-02-24T12:00:00.000Z"),
        durationMinutes: 120,
        plannedSocialGain: 48,
        plannedHungerLoss: 32,
      },
      history: [],
    };

    playerRepository.findByUserId.mockResolvedValue(player);
    playerParkRepository.findByUserId.mockResolvedValue(record);
    playerRepository.savePlayer.mockResolvedValue({});
    playerParkRepository.savePlayerPark.mockResolvedValue({});
    progressionService.recordSocialAction.mockResolvedValue({});
    globalEventService.recordContribution.mockResolvedValue({});

    const result = await parkService.leavePark("user-1", now);

    expect(result.ok).toBe(true);
    expect(result.completed).toBe(false);
    expect(result.socialGain).toBe(12);
    expect(result.hungerLoss).toBe(8);
    expect(result.socialNow).toBe(62);
    expect(result.hungerNow).toBe(72);
    expect(record.activeSession).toBeNull();
  });

  it("returns null session in status when user has no park record", async () => {
    playerParkRepository.findByUserId.mockResolvedValue(null);
    playerParkRepository.countActive.mockResolvedValue(3);

    const status = await parkService.getParkStatus("user-1", new Date());

    expect(status).toEqual({
      activeCount: 3,
      session: null,
    });
  });

  it("auto-resolves ready sessions when monitor runs", async () => {
    const now = new Date("2026-02-24T12:00:00.000Z");
    const player = {
      userId: "user-1",
      social: 40,
      hunger: 70,
      lastCare: {},
    };
    const record = {
      userId: "user-1",
      activeSession: {
        startedAt: new Date("2026-02-24T11:30:00.000Z"),
        resolvedAt: new Date("2026-02-24T12:00:00.000Z"),
        durationMinutes: 30,
        plannedSocialGain: 15,
        plannedHungerLoss: 10,
      },
      history: [],
    };

    playerParkRepository.listReadyForAutoReturn.mockResolvedValue([record]);
    playerRepository.findByUserId.mockResolvedValue(player);
    playerRepository.savePlayer.mockResolvedValue({});
    playerParkRepository.savePlayerPark.mockResolvedValue({});
    progressionService.recordSocialAction.mockResolvedValue({});
    globalEventService.recordContribution.mockResolvedValue({});

    const result = await parkService.pullReadyAutoReturns(now);

    expect(result).toEqual({
      count: 1,
      userIds: ["user-1"],
    });
    expect(record.activeSession).toBeNull();
    expect(player.social).toBe(55);
    expect(player.hunger).toBe(60);
  });
});
