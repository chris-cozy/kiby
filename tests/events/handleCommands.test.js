jest.mock("../../src/utils/getLocalCommands", () => jest.fn());
jest.mock("../../src/utils/interactionReply", () => ({
  safeReply: jest.fn().mockResolvedValue(),
}));
jest.mock("../../src/config/env", () => ({
  devUserIds: [],
  testGuildId: "",
}));
jest.mock("../../src/repositories/playerAdventureRepository", () => ({
  findByUserId: jest.fn(),
}));

const getLocalCommands = require("../../src/utils/getLocalCommands");
const { safeReply } = require("../../src/utils/interactionReply");
const playerAdventureRepository = require("../../src/repositories/playerAdventureRepository");
const handleCommands = require("../../src/events/interactionCreate/handleCommands");

function buildInteraction({ commandName = "feed", subcommand = "start" } = {}) {
  return {
    commandName,
    user: { id: "user-1" },
    options: {
      getSubcommand: () => subcommand,
    },
    isChatInputCommand: () => true,
    isAutocomplete: () => false,
  };
}

describe("handleCommands adventure claim gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks non-bypass commands until /adventure claim is used", async () => {
    const callback = jest.fn();
    getLocalCommands.mockReturnValue([
      {
        name: "feed",
        callback,
      },
    ]);
    playerAdventureRepository.findByUserId.mockResolvedValue({
      activeRun: {
        claimedAt: null,
        resolvedAt: new Date("2026-02-25T00:00:00.000Z"),
      },
    });

    const interaction = buildInteraction({
      commandName: "feed",
      subcommand: "send",
    });
    await handleCommands({}, interaction);

    expect(callback).not.toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(
      interaction,
      expect.objectContaining({
        content: expect.stringContaining("/adventure claim"),
      })
    );
  });

  it("allows /adventure claim while gate is active", async () => {
    const callback = jest.fn();
    getLocalCommands.mockReturnValue([
      {
        name: "adventure",
        callback,
      },
    ]);
    playerAdventureRepository.findByUserId.mockResolvedValue({
      activeRun: {
        claimedAt: null,
        resolvedAt: new Date("2026-02-25T00:00:00.000Z"),
      },
    });

    const interaction = buildInteraction({
      commandName: "adventure",
      subcommand: "claim",
    });
    await handleCommands({}, interaction);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
