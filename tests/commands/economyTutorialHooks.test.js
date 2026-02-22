jest.mock("../../src/utils/interactionReply", () => ({
  safeDefer: jest.fn().mockResolvedValue(),
  safeReply: jest.fn().mockResolvedValue(),
}));

jest.mock("../../src/utils/tutorialFollowUp", () => ({
  recordTutorialEventAndFollowUp: jest.fn().mockResolvedValue({
    ok: true,
    changed: true,
  }),
}));

jest.mock("../../src/services/playerService", () => ({
  getPlayerByUserId: jest.fn(),
}));

jest.mock("../../src/services/progressionService", () => ({
  claimDailyReward: jest.fn(),
  claimQuestReward: jest.fn(),
  rerollQuest: jest.fn(),
  getQuestStatus: jest.fn(),
}));

jest.mock("../../src/services/economyService", () => ({
  listShopItems: jest.fn(() => [
    {
      id: "food_pack",
      label: "Food Pack",
      cost: 20,
      category: "consumable",
      useContexts: ["direct"],
      description: "Restores hunger.",
    },
  ]),
  listItemsByContext: jest.fn(() => []),
  getEconomy: jest.fn(),
  buyItem: jest.fn(),
}));

jest.mock("../../src/classes/command", () =>
  jest.fn().mockImplementation(() => ({
    pink: "#FF69B4",
    get_media_attachment: jest.fn().mockResolvedValue({
      mediaString: "attachment://shop.png",
      mediaAttach: { name: "shop.png" },
    }),
  }))
);

const progressionService = require("../../src/services/progressionService");
const playerService = require("../../src/services/playerService");
const economyService = require("../../src/services/economyService");
const {
  recordTutorialEventAndFollowUp,
} = require("../../src/utils/tutorialFollowUp");
const dailyCommand = require("../../src/commands/progression/daily");
const questsCommand = require("../../src/commands/progression/quests");
const shopCommand = require("../../src/commands/economy/shop");
const inventoryCommand = require("../../src/commands/economy/inventory");

function buildInteraction({
  subcommand = "",
  userId = "user-1",
  strings = {},
} = {}) {
  return {
    user: { id: userId },
    options: {
      getSubcommand: () => subcommand,
      getString: (key) => strings[key] || null,
      getInteger: () => null,
    },
  };
}

describe("economy tutorial event hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    economyService.listShopItems.mockReturnValue([
      {
        id: "food_pack",
        label: "Food Pack",
        cost: 20,
        category: "consumable",
        useContexts: ["direct"],
        description: "Restores hunger.",
      },
    ]);
    economyService.listItemsByContext.mockReturnValue([]);
    economyService.getEconomy.mockResolvedValue({
      starCoins: 100,
      inventory: new Map([["food_pack", 1]]),
    });
    playerService.getPlayerByUserId.mockResolvedValue({
      userId: "user-1",
      kirbyName: "Nova",
    });
  });

  it("records economy interaction from /daily success", async () => {
    progressionService.claimDailyReward.mockResolvedValue({
      ok: true,
      reward: 20,
      streak: 1,
      streakShieldCharges: 1,
      resetInSeconds: 600,
      timezone: "UTC",
    });

    await dailyCommand.callback({}, buildInteraction());

    expect(recordTutorialEventAndFollowUp).toHaveBeenCalledWith(
      expect.any(Object),
      "user-1",
      "economy-interaction",
      { interaction: "daily" },
      expect.any(Date)
    );
  });

  it("records economy interaction from /quests view", async () => {
    progressionService.getQuestStatus.mockResolvedValue({
      dailyStreak: 1,
      streakShieldCharges: 1,
      rerollsRemaining: 1,
      timezone: "UTC",
      resetInSeconds: 600,
      quests: [
        {
          id: "slot-1",
          label: "Feed your Kiby",
          progress: 0,
          goal: 3,
          rewardCoins: 25,
          claimed: false,
          completed: false,
        },
      ],
      bonusQuest: {
        label: "Complete 8 care actions",
        progress: 0,
        goal: 8,
        rewardCoins: 70,
        claimed: false,
        completed: false,
      },
    });

    await questsCommand.callback({}, buildInteraction({ subcommand: "view" }));

    expect(recordTutorialEventAndFollowUp).toHaveBeenCalledWith(
      expect.any(Object),
      "user-1",
      "economy-interaction",
      { interaction: "quests-view" },
      expect.any(Date)
    );
  });

  it("records economy interaction from /shop list", async () => {
    await shopCommand.callback({}, buildInteraction({ subcommand: "list" }));

    expect(recordTutorialEventAndFollowUp).toHaveBeenCalledWith(
      expect.any(Object),
      "user-1",
      "economy-interaction",
      { interaction: "shop-list" },
      expect.any(Date)
    );
  });

  it("records economy interaction from /inventory", async () => {
    await inventoryCommand.callback({}, buildInteraction());

    expect(recordTutorialEventAndFollowUp).toHaveBeenCalledWith(
      expect.any(Object),
      "user-1",
      "economy-interaction",
      { interaction: "inventory" },
      expect.any(Date)
    );
  });
});
