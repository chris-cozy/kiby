jest.mock("../../src/utils/interactionReply", () => ({
  safeDefer: jest.fn().mockResolvedValue(),
  safeReply: jest.fn().mockResolvedValue(),
}));

const packageInfo = require("../../package.json");
const { safeDefer, safeReply } = require("../../src/utils/interactionReply");
const versionCommand = require("../../src/commands/dev/version");

describe("/version command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the current application version", async () => {
    const interaction = {};

    await versionCommand.callback({}, interaction);

    expect(safeDefer).toHaveBeenCalledWith(interaction, { ephemeral: true });
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      content: `Current application version: **${packageInfo.version}**`,
      ephemeral: true,
    });
  });
});
