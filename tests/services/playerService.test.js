jest.mock("../../src/config/env", () => ({
  maxKirbyNameLength: 24,
}));

jest.mock("../../src/repositories/playerRepository", () => ({
  findByUserId: jest.fn(),
  createPlayer: jest.fn(),
}));

jest.mock("../../src/services/sleepService", () => ({
  getScheduleForUser: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../src/services/economyService", () => ({
  ensureEconomy: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../src/services/progressionService", () => ({
  ensureProgress: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../src/utils/sanitizeKirbyName", () =>
  jest.fn((name) => name.trim())
);

const playerRepository = require("../../src/repositories/playerRepository");
const { getActionCooldownMs } = require("../../src/domain/care/rules");
const playerService = require("../../src/services/playerService");

describe("playerService adoption readiness", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets pet and train as immediately available after adoption", async () => {
    playerRepository.findByUserId.mockResolvedValue(null);
    playerRepository.createPlayer.mockImplementation(async (payload) => payload);

    const result = await playerService.adoptPlayer("user-1", "Nova");
    expect(result.created).toBe(true);

    const payload = playerRepository.createPlayer.mock.calls[0][0];
    const adoptedAt = new Date(payload.adoptedAt).getTime();
    const petAt = new Date(payload.lastCare.pet).getTime();
    const trainAt = new Date(payload.lastCare.train).getTime();

    expect(adoptedAt - petAt).toBe(getActionCooldownMs("pet"));
    expect(adoptedAt - trainAt).toBe(getActionCooldownMs("train"));
  });
});
