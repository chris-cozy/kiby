const adventureService = require("../../src/services/adventureService");

describe("adventure service constants", () => {
  it("defines four routes with shifted recommended BP tiers", () => {
    const summary = adventureService.ROUTES.map((route) => ({
      id: route.id,
      recommendedBattlePower: route.recommendedBattlePower,
    }));

    expect(summary).toEqual([
      { id: "meadow_patrol", recommendedBattlePower: 0 },
      { id: "crystal_cavern", recommendedBattlePower: 90 },
      { id: "starfall_ruins", recommendedBattlePower: 180 },
      { id: "obsidian_citadel", recommendedBattlePower: 300 },
    ]);
  });
});
