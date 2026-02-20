const { buildBattleProfile } = require("../../src/domain/battle/contracts");

describe("battle contracts", () => {
  it("builds a stable profile projection", () => {
    const result = buildBattleProfile({
      type: "player",
      userId: "123",
      kirbyName: "Nova Kirby",
      level: 4,
      xp: 10,
      hp: 90,
      hunger: 70,
      affection: 80,
      social: 65,
      battlePower: 120,
    });

    expect(result).toEqual({
      entityType: "player",
      entityId: "123",
      kirbyName: "Nova Kirby",
      level: 4,
      hp: 90,
      hunger: 70,
      affection: 80,
      social: 65,
      battlePower: 120,
      battleRating: 650,
    });
  });
});
