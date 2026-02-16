const { simulateNpcTick } = require("../../src/domain/npc/simulator");

function createNpc() {
  const now = new Date("2026-02-01T00:00:00.000Z");
  return {
    npcId: "npc-001",
    displayName: "Nova",
    kirbyName: "Nova Kirby",
    tier: "active",
    careStyle: "consistent caregiver",
    behaviorSeed: 12345,
    level: 1,
    xp: 0,
    hp: 100,
    hunger: 90,
    affection: 90,
    adoptedAt: now,
    lastCare: {
      feed: now,
      pet: now,
      play: now,
    },
  };
}

describe("npc simulator", () => {
  it("produces deterministic updates for same seed and timestamp", () => {
    const now = new Date("2026-02-01T02:00:00.000Z");

    const npcA = createNpc();
    const npcB = createNpc();

    const resultA = simulateNpcTick(npcA, {
      now,
      neglectThresholdMs: 60 * 60 * 1000,
    });

    const resultB = simulateNpcTick(npcB, {
      now,
      neglectThresholdMs: 60 * 60 * 1000,
    });

    expect(resultA).toEqual(resultB);
    expect(npcA.behaviorSeed).toBe(npcB.behaviorSeed);
    expect(npcA.level).toBe(npcB.level);
    expect(npcA.xp).toBe(npcB.xp);
    expect(npcA.hunger).toBe(npcB.hunger);
    expect(npcA.affection).toBe(npcB.affection);
  });
});
