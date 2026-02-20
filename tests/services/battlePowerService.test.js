const {
  applyLazyDecay,
  applyTrainingGain,
} = require("../../src/services/battlePowerService");

describe("battle power service", () => {
  it("applies lazy decay based on elapsed time", () => {
    const profile = {
      battlePower: 200,
      battlePowerUpdatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    const result = applyLazyDecay(profile, new Date("2026-01-03T00:00:00.000Z"), {
      touch: false,
    });

    expect(result.decayed).toBeGreaterThan(0);
    expect(profile.battlePower).toBeLessThan(200);
  });

  it("applies training gain after decay", () => {
    const now = new Date("2026-02-01T12:00:00.000Z");
    const profile = {
      battlePower: 90,
      battlePowerUpdatedAt: now,
    };

    const result = applyTrainingGain(profile, now, () => 12);

    expect(result.gain).toBe(12);
    expect(result.battlePower).toBe(102);
    expect(profile.battlePowerUpdatedAt.toISOString()).toBe(now.toISOString());
  });
});
