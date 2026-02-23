jest.mock("../../src/config/env", () => ({
  devUserIds: ["dev-user", "dev-2"],
}));

jest.mock("../../src/repositories/playerRepository", () => ({
  listAllPlayers: jest.fn(),
}));

jest.mock("../../src/repositories/playerProgressRepository", () => ({
  listActiveSince: jest.fn(),
}));

jest.mock("../../src/utils/interactionReply", () => ({
  safeDefer: jest.fn().mockResolvedValue(),
  safeReply: jest.fn().mockResolvedValue(),
}));

jest.mock("../../src/utils/logger", () => ({
  warn: jest.fn(),
}));

jest.mock("../../src/services/notificationService", () => ({
  sendDirectMessage: jest.fn(),
}));

const { ChannelType } = require("discord.js");
const playerRepository = require("../../src/repositories/playerRepository");
const playerProgressRepository = require("../../src/repositories/playerProgressRepository");
const notificationService = require("../../src/services/notificationService");
const { safeReply } = require("../../src/utils/interactionReply");
const systemCommand = require("../../src/commands/dev/notifications");

function buildInteraction(mode) {
  return {
    user: {
      id: "dev-user",
    },
    options: {
      getString: (key) => {
        if (key === "mode") {
          return mode;
        }
        if (key === "subject") {
          return "Maintenance Notice";
        }
        if (key === "body") {
          return "Downtime starts in 10 minutes.";
        }
        return null;
      },
    },
  };
}

describe("/system command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notificationService.sendDirectMessage.mockResolvedValue(true);
  });

  it("uses last-72h active player IDs in active_72h mode", async () => {
    playerProgressRepository.listActiveSince.mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
      { userId: "u1" },
      {},
    ]);

    const dmSend = jest.fn().mockResolvedValue({});
    const createDM = jest.fn().mockResolvedValue({ send: dmSend });
    const usersFetch = jest.fn().mockResolvedValue({ createDM });
    const guildChannelSend = jest.fn().mockResolvedValue({});

    const client = {
      users: { fetch: usersFetch },
      guilds: {
        cache: new Map([
          [
            "g1",
            {
              id: "g1",
              name: "Guild One",
              members: { me: {} },
              systemChannel: {
                id: "g1-system",
                isTextBased: () => true,
                isDMBased: () => false,
                send: guildChannelSend,
              },
              publicUpdatesChannel: null,
              channels: { fetch: jest.fn().mockResolvedValue(new Map()) },
            },
          ],
        ]),
      },
    };

    await systemCommand.callback(client, buildInteraction("active_72h"));

    expect(playerProgressRepository.listActiveSince).toHaveBeenCalledTimes(1);
    expect(playerRepository.listAllPlayers).not.toHaveBeenCalled();
    expect(usersFetch).toHaveBeenCalledTimes(2);
    expect(dmSend).toHaveBeenCalledTimes(2);
    expect(guildChannelSend).not.toHaveBeenCalled();
    expect(notificationService.sendDirectMessage).toHaveBeenCalledTimes(2);
    expect(safeReply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        content: expect.stringContaining("Mode: `active_72h`"),
      })
    );
    expect(safeReply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        content: expect.stringContaining("Developer reports delivered: 2/2."),
      })
    );
  });

  it("fans out to all players and installed servers in all_installed mode", async () => {
    playerRepository.listAllPlayers.mockResolvedValue([{ userId: "u1" }, { userId: "u2" }]);

    const dmSend = jest.fn().mockResolvedValue({});
    const createDM = jest.fn().mockResolvedValue({ send: dmSend });
    const usersFetch = jest.fn().mockResolvedValue({ createDM });
    const systemChannelSend = jest.fn().mockRejectedValue(new Error("Missing Access"));
    const fallbackChannelSend = jest.fn().mockResolvedValue({});

    const client = {
      users: { fetch: usersFetch },
      guilds: {
        cache: new Map([
          [
            "g1",
            {
              id: "g1",
              name: "Guild One",
              members: { me: {} },
              systemChannel: {
                id: "g1-system",
                isTextBased: () => true,
                isDMBased: () => false,
                send: systemChannelSend,
              },
              publicUpdatesChannel: null,
              channels: {
                fetch: jest.fn().mockResolvedValue(
                  new Map([
                    [
                      "c1",
                      {
                        id: "g1-fallback",
                        type: ChannelType.GuildText,
                        isTextBased: () => true,
                        isDMBased: () => false,
                        send: fallbackChannelSend,
                      },
                    ],
                  ])
                ),
              },
            },
          ],
          [
            "g2",
            {
              id: "g2",
              name: "Guild Two",
              members: { me: {} },
              systemChannel: null,
              publicUpdatesChannel: null,
              channels: {
                fetch: jest.fn().mockResolvedValue(
                  new Map([
                    [
                      "c1",
                      {
                        id: "g2-voice",
                        type: ChannelType.GuildVoice,
                        isTextBased: () => false,
                        isDMBased: () => false,
                      },
                    ],
                  ])
                ),
              },
            },
          ],
        ]),
      },
    };

    await systemCommand.callback(client, buildInteraction("all_installed"));

    expect(playerRepository.listAllPlayers).toHaveBeenCalledTimes(1);
    expect(playerProgressRepository.listActiveSince).not.toHaveBeenCalled();
    expect(usersFetch).toHaveBeenCalledTimes(2);
    expect(dmSend).toHaveBeenCalledTimes(2);
    expect(systemChannelSend).toHaveBeenCalledTimes(1);
    expect(fallbackChannelSend).toHaveBeenCalledTimes(1);
    expect(notificationService.sendDirectMessage).toHaveBeenCalledTimes(2);
    expect(safeReply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        content: expect.stringContaining(
          "Server messages delivered: 1/1 servers with candidate channels (2 installed servers)."
        ),
      })
    );
    expect(safeReply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        content: expect.stringContaining("Developer reports delivered: 2/2."),
      })
    );
  });
});
