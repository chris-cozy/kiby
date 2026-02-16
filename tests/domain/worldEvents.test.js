const { EVENTS } = require("../../src/domain/events/worldEvents");

describe("world events", () => {
  it("defines at least one positive and one negative event", () => {
    expect(EVENTS.length).toBeGreaterThan(0);

    const profile = {
      hp: 50,
      hunger: 50,
      affection: 50,
    };

    const deltas = EVENTS.map((event) => event.apply({ ...profile }));
    const flattened = deltas.flatMap((delta) => Object.values(delta));

    expect(flattened.some((value) => value > 0)).toBe(true);
    expect(flattened.some((value) => value < 0)).toBe(true);
  });
});
