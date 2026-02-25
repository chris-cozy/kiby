jest.mock("../../src/config/env", () => ({
  socialReceiveCooldownMinutes: 45,
}));

jest.mock("../../src/repositories/playerRepository", () => ({
  findByUserId: jest.fn(),
  listAllPlayers: jest.fn(),
  savePlayer: jest.fn(),
}));

jest.mock("../../src/repositories/npcRepository", () => ({
  findByNpcId: jest.fn(),
  listAll: jest.fn(),
  saveNpc: jest.fn(),
}));

jest.mock("../../src/repositories/playerAdventureRepository", () => ({
  findByUserId: jest.fn(),
}));

jest.mock("../../src/repositories/playerParkRepository", () => ({
  findByUserId: jest.fn(),
}));

jest.mock("../../src/services/progressionService", () => ({
  recordSocialAction: jest.fn(),
}));

jest.mock("../../src/services/globalEventService", () => ({
  recordContribution: jest.fn(),
}));

jest.mock("../../src/services/npcService", () => ({
  ensureNpcSeeded: jest.fn().mockResolvedValue(undefined),
}));

const playerRepository = require("../../src/repositories/playerRepository");
const npcRepository = require("../../src/repositories/npcRepository");
const playerAdventureRepository = require("../../src/repositories/playerAdventureRepository");
const playerParkRepository = require("../../src/repositories/playerParkRepository");
const progressionService = require("../../src/services/progressionService");
const globalEventService = require("../../src/services/globalEventService");
const npcService = require("../../src/services/npcService");
const socialService = require("../../src/services/socialService");

describe("socialService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    playerAdventureRepository.findByUserId.mockResolvedValue(null);
    playerParkRepository.findByUserId.mockResolvedValue(null);
  });

  it("blocks /playdate when receiver cooldown is active", async () => {
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

    playerRepository.findByUserId.mockResolvedValueOnce(sender);
    playerRepository.findByUserId.mockResolvedValueOnce(target);

    const result = await socialService.runPlaydate(
      "sender",
      "player:target",
      now
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("target-cooldown");
    expect(result.waitMs).toBeGreaterThan(0);
    expect(playerRepository.savePlayer).not.toHaveBeenCalled();
  });

  it("blocks /playdate when sender playdate cooldown is active", async () => {
    const now = new Date("2026-02-18T12:00:00.000Z");
    const sender = {
      userId: "sender",
      social: 50,
      lastPlaydateAt: new Date("2026-02-18T11:45:00.000Z"),
      lastCare: {
        socialPlay: new Date("2026-02-18T11:45:00.000Z"),
      },
    };
    const npc = {
      npcId: "npc-001",
      kirbyName: "Nova",
      affection: 40,
      social: 30,
      lastCare: {},
    };

    playerRepository.findByUserId.mockResolvedValueOnce(sender);
    npcRepository.findByNpcId.mockResolvedValueOnce(npc);

    const result = await socialService.runPlaydate("sender", "npc:npc-001", now);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("cooldown");
    expect(result.waitMs).toBeGreaterThan(0);
  });

  it("does not treat park social timestamp as playdate cooldown", async () => {
    const now = new Date("2026-02-18T12:00:00.000Z");
    const sender = {
      userId: "sender",
      social: 50,
      // Park and other social actions may update this field.
      lastCare: {
        socialPlay: new Date("2026-02-18T11:55:00.000Z"),
      },
    };
    const npc = {
      npcId: "npc-001",
      kirbyName: "Nova",
      affection: 40,
      social: 30,
      lastCare: {
        socialPlay: new Date("2026-02-18T10:00:00.000Z"),
      },
    };

    playerRepository.findByUserId.mockResolvedValueOnce(sender);
    npcRepository.findByNpcId.mockResolvedValueOnce(npc);
    playerRepository.savePlayer.mockResolvedValue({});
    npcRepository.saveNpc.mockResolvedValue({});
    progressionService.recordSocialAction.mockResolvedValue({});
    globalEventService.recordContribution.mockResolvedValue({});

    const result = await socialService.runPlaydate("sender", "npc:npc-001", now);

    expect(result.ok).toBe(true);
    expect(result.targetType).toBe("npc");
  });

  it("applies gains for NPC playdate targets", async () => {
    const now = new Date("2026-02-18T12:00:00.000Z");
    const sender = {
      userId: "sender",
      social: 50,
      lastCare: {
        socialPlay: new Date("2026-02-18T10:00:00.000Z"),
      },
    };
    const npc = {
      npcId: "npc-001",
      kirbyName: "Nova",
      affection: 40,
      social: 30,
      lastCare: {
        socialPlay: new Date("2026-02-18T10:00:00.000Z"),
      },
    };

    playerRepository.findByUserId.mockResolvedValueOnce(sender);
    npcRepository.findByNpcId.mockResolvedValueOnce(npc);
    playerRepository.savePlayer.mockResolvedValue({});
    npcRepository.saveNpc.mockResolvedValue({});
    progressionService.recordSocialAction.mockResolvedValue({});
    globalEventService.recordContribution.mockResolvedValue({});

    const result = await socialService.runPlaydate(
      "sender",
      "npc:npc-001",
      now
    );

    expect(result.ok).toBe(true);
    expect(result.targetType).toBe("npc");
    expect(result.senderGain).toBe(6);
    expect(result.targetAffectionGain).toBe(4);
    expect(result.targetSocialGain).toBe(3);
    expect(playerRepository.savePlayer).toHaveBeenCalledTimes(1);
    expect(npcRepository.saveNpc).toHaveBeenCalledTimes(1);
  });

  it("returns combined player + NPC autocomplete targets", async () => {
    playerRepository.listAllPlayers.mockResolvedValue([
      {
        userId: "player-1",
        kirbyName: "Skipper",
      },
    ]);
    npcRepository.listAll.mockResolvedValue([
      {
        npcId: "npc-001",
        kirbyName: "Nova",
        displayName: "Nova",
      },
    ]);

    const rows = await socialService.listPlaydateTargets("n", 25, "player-self");

    expect(rows).toEqual([
      expect.objectContaining({
        name: "Nova ✧",
        value: "npc:npc-001",
      }),
    ]);
  });

  it("falls back to NPC names when query has no direct matches", async () => {
    playerRepository.listAllPlayers.mockResolvedValue([]);
    npcRepository.listAll.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        npcId: "npc-001",
        kirbyName: "Nova",
        displayName: "Nova",
      },
    ]);

    const rows = await socialService.listPlaydateTargets("zzz", 25, "player-self");

    expect(rows).toEqual([
      expect.objectContaining({
        name: "Nova ✧",
        value: "npc:npc-001",
      }),
    ]);
    expect(npcService.ensureNpcSeeded).toHaveBeenCalledTimes(1);
  });

  it("resolves npc target after seed fallback when npc lookup misses", async () => {
    const now = new Date("2026-02-18T12:00:00.000Z");
    const sender = {
      userId: "sender",
      social: 50,
      lastCare: {
        socialPlay: new Date("2026-02-18T10:00:00.000Z"),
      },
    };
    const npc = {
      npcId: "npc-001",
      kirbyName: "Nova",
      affection: 40,
      social: 30,
      lastCare: {
        socialPlay: new Date("2026-02-18T10:00:00.000Z"),
      },
    };

    playerRepository.findByUserId.mockResolvedValueOnce(sender);
    npcRepository.findByNpcId.mockResolvedValueOnce(null);
    npcRepository.listAll.mockResolvedValueOnce([]).mockResolvedValueOnce([npc]);
    playerRepository.savePlayer.mockResolvedValue({});
    npcRepository.saveNpc.mockResolvedValue({});
    progressionService.recordSocialAction.mockResolvedValue({});
    globalEventService.recordContribution.mockResolvedValue({});

    const result = await socialService.runPlaydate("sender", "npc:npc-001", now);

    expect(result.ok).toBe(true);
    expect(result.targetType).toBe("npc");
    expect(result.targetId).toBe("npc-001");
    expect(npcService.ensureNpcSeeded).toHaveBeenCalledTimes(1);
  });
});
