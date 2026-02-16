const { applyCareAction, applyDecay, getActionCooldownMs } = require("../../src/domain/care/rules");

describe("care rules", () => {
  it("enforces feed cooldown", () => {
    const now = new Date("2026-02-01T12:00:00.000Z");
    const profile = {
      level: 1,
      xp: 0,
      hp: 100,
      hunger: 50,
      affection: 50,
      lastCare: {
        feed: new Date(now.getTime() - 2 * 60 * 1000),
        pet: new Date(now),
        play: new Date(now),
      },
    };

    const result = applyCareAction(profile, "feed", now, () => 8);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("cooldown");
    expect(result.waitMs).toBeGreaterThan(0);
    expect(getActionCooldownMs("feed")).toBe(10 * 60 * 1000);
  });

  it("applies affection decay after neglect", () => {
    const now = new Date("2026-02-01T12:00:00.000Z");
    const profile = {
      hunger: 100,
      affection: 50,
      hp: 100,
      level: 1,
      xp: 0,
      lastCare: {
        feed: new Date(now.getTime() - 5 * 60 * 1000),
        pet: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        play: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    };

    const result = applyDecay(profile, {
      now,
      neglectThresholdMs: 60 * 60 * 1000,
      rng: () => 2,
      notificationThreshold: 49,
    });

    expect(result.profile.affection).toBe(48);
    expect(result.events.affectionDroppedBelowThreshold).toBe(true);
  });
});
