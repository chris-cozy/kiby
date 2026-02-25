jest.mock("../../src/utils/interactionReply", () => ({
  safeDefer: jest.fn().mockResolvedValue(),
  safeReply: jest.fn().mockResolvedValue(),
}));

jest.mock("../../src/services/socialService", () => ({
  setSocialOptIn: jest.fn(),
  listPlaydateTargets: jest.fn().mockResolvedValue([]),
  runPlaydate: jest.fn(),
}));

jest.mock("../../src/classes/command", () =>
  jest.fn().mockImplementation(() => ({
    pink: "#ff77aa",
    get_media_attachment: jest.fn().mockResolvedValue({
      mediaString: "attachment://playdate.png",
      mediaAttach: { name: "playdate.png" },
    }),
  }))
);

jest.mock("../../src/utils/tutorialFollowUp", () => ({
  recordTutorialEventAndFollowUp: jest.fn().mockResolvedValue({
    ok: true,
    changed: true,
  }),
}));

const { safeDefer, safeReply } = require("../../src/utils/interactionReply");
const socialService = require("../../src/services/socialService");
const {
  recordTutorialEventAndFollowUp,
} = require("../../src/utils/tutorialFollowUp");
const playdateCommand = require("../../src/commands/social/playdate");

function buildSettingsInteraction(optIn = true) {
  return {
    user: { id: "user-1" },
    options: {
      getSubcommand: () => "settings",
      getBoolean: () => optIn,
    },
  };
}

function buildSendInteraction(kiby = "npc:npc-001") {
  return {
    user: { id: "user-1", username: "Tester" },
    options: {
      getSubcommand: () => "send",
      getString: () => kiby,
    },
  };
}

describe("/playdate command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records playdate-settings tutorial event on /playdate settings success", async () => {
    socialService.setSocialOptIn.mockResolvedValue({
      ok: true,
      enabled: true,
    });

    await playdateCommand.callback({}, buildSettingsInteraction(true));

    expect(safeDefer).toHaveBeenCalledWith(expect.any(Object), { ephemeral: true });
    expect(socialService.setSocialOptIn).toHaveBeenCalledWith("user-1", true);
    expect(safeReply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        content: expect.stringContaining("enabled"),
      })
    );
    expect(recordTutorialEventAndFollowUp).toHaveBeenCalledWith(
      expect.any(Object),
      "user-1",
      "playdate-settings",
      { optIn: true },
      expect.any(Date)
    );
  });

  it("returns npc fallback autocomplete option when no targets are returned", async () => {
    socialService.listPlaydateTargets.mockResolvedValueOnce([]);
    const interaction = {
      user: { id: "user-1" },
      options: {
        getFocused: () => ({
          name: "kiby",
          value: "",
        }),
      },
      respond: jest.fn().mockResolvedValue(undefined),
    };

    await playdateCommand.autocomplete({}, interaction);

    expect(socialService.listPlaydateTargets).toHaveBeenCalledWith(
      "",
      25,
      "user-1"
    );
    expect(interaction.respond).toHaveBeenCalledWith([
      {
        name: "Type a Kiby name to search",
        value: "__no_target__",
      },
    ]);
  });

  it("formats NPC target label with ✧ in completion embed", async () => {
    socialService.runPlaydate.mockResolvedValueOnce({
      ok: true,
      targetType: "npc",
      targetId: "npc-001",
      targetKirbyName: "Nova",
      targetOwnerUserId: "",
      senderGain: 6,
      senderSocialNow: 66,
      targetAffectionGain: 4,
      targetAffectionNow: 77,
      targetSocialGain: 3,
      targetSocialNow: 55,
    });

    await playdateCommand.callback({}, buildSendInteraction());

    expect(safeReply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        embeds: [
          expect.objectContaining({
            data: expect.objectContaining({
              description: "Your Kiby spent time with **Nova ✧**.",
            }),
          }),
        ],
      })
    );
  });
});
