const env = require("../config/env");
const playerEconomyRepository = require("../repositories/playerEconomyRepository");
const { applyLevelProgression } = require("../domain/progression/calculateXpForLevel");
const { getDayKeyInTimeZone } = require("../utils/timezoneDayKey");

const ITEM_CATEGORIES = {
  CONSUMABLE: "consumable",
  TOY: "toy",
  SUPPORT: "support",
};

const SHOP_ITEMS = {
  food_pack: {
    id: "food_pack",
    label: "Food Pack",
    cost: 20,
    category: ITEM_CATEGORIES.CONSUMABLE,
    useContexts: ["direct"],
    effect: {
      hunger: 20,
    },
    description: "Restores hunger.",
    tradable: true,
  },
  gourmet_meal: {
    id: "gourmet_meal",
    label: "Gourmet Meal",
    cost: 40,
    category: ITEM_CATEGORIES.CONSUMABLE,
    useContexts: ["direct"],
    effect: {
      hunger: 35,
      affection: 6,
    },
    description: "Large hunger recovery with a small affection boost.",
    tradable: true,
  },
  toy_box: {
    id: "toy_box",
    label: "Toy Box",
    cost: 28,
    category: ITEM_CATEGORIES.TOY,
    useContexts: ["play"],
    effect: {
      affection: 7,
      xp: 4,
    },
    description: "Use during /play for balanced affection and XP gains.",
    tradable: true,
  },
  sparkle_ball: {
    id: "sparkle_ball",
    label: "Sparkle Ball",
    cost: 45,
    category: ITEM_CATEGORIES.TOY,
    useContexts: ["play"],
    effect: {
      affection: 10,
      xp: 6,
    },
    description: "High affection toy with strong XP payoff.",
    tradable: true,
  },
  nebula_kite: {
    id: "nebula_kite",
    label: "Nebula Kite",
    cost: 60,
    category: ITEM_CATEGORIES.TOY,
    useContexts: ["play"],
    effect: {
      affection: 8,
      xp: 10,
    },
    description: "Premium toy for XP-heavy play sessions.",
    tradable: true,
  },
  health_kit: {
    id: "health_kit",
    label: "Health Kit",
    cost: 30,
    category: ITEM_CATEGORIES.CONSUMABLE,
    useContexts: ["direct"],
    effect: {
      hp: 20,
    },
    description: "Restores HP.",
    tradable: true,
  },
  deluxe_health_kit: {
    id: "deluxe_health_kit",
    label: "Deluxe Health Kit",
    cost: 55,
    category: ITEM_CATEGORIES.CONSUMABLE,
    useContexts: ["direct"],
    effect: {
      hp: 35,
    },
    description: "Strong HP recovery.",
    tradable: true,
  },
  star_snack: {
    id: "star_snack",
    label: "Star Snack",
    cost: 50,
    category: ITEM_CATEGORIES.CONSUMABLE,
    useContexts: ["direct"],
    effect: {
      xp: 40,
    },
    description: "Boosts XP progression.",
    tradable: true,
  },
  mood_cookie: {
    id: "mood_cookie",
    label: "Mood Cookie",
    cost: 42,
    category: ITEM_CATEGORIES.CONSUMABLE,
    useContexts: ["direct"],
    effect: {
      affection: 15,
    },
    description: "Boosts affection to stabilize mood.",
    tradable: true,
  },
  travel_charm: {
    id: "travel_charm",
    label: "Travel Charm",
    cost: 48,
    category: ITEM_CATEGORIES.SUPPORT,
    useContexts: ["adventure"],
    effect: {
      adventureMitigation: 0.12,
      adventureRewardBoost: 0.1,
    },
    description: "Adventure support item reducing damage and boosting rewards.",
    tradable: true,
  },
  guardian_band: {
    id: "guardian_band",
    label: "Guardian Band",
    cost: 75,
    category: ITEM_CATEGORIES.SUPPORT,
    useContexts: ["adventure"],
    effect: {
      adventureMitigation: 0.2,
      adventureRewardBoost: 0.15,
    },
    description: "Premium adventure support with strong risk mitigation.",
    tradable: false,
  },
};

function clampStat(value) {
  return Math.min(100, Math.max(0, value));
}

function roundScaled(value, scale) {
  return Math.max(0, Math.round(value * scale));
}

async function ensureEconomy(userId) {
  return playerEconomyRepository.upsertByUserId(userId);
}

async function getEconomy(userId) {
  return ensureEconomy(userId);
}

function getItemById(itemId) {
  return SHOP_ITEMS[itemId];
}

function listShopItems() {
  return Object.values(SHOP_ITEMS);
}

function listItemsByContext(context) {
  return Object.values(SHOP_ITEMS).filter((item) =>
    (item.useContexts || []).includes(context)
  );
}

function getInventoryCount(inventory, itemId) {
  const rawValue = inventory.get(itemId) || 0;
  return Number(rawValue) || 0;
}

function setInventoryCount(inventory, itemId, count) {
  if (count <= 0) {
    inventory.delete(itemId);
    return;
  }

  inventory.set(itemId, count);
}

function resetGiftWindowIfNeeded(economy, dayKey) {
  economy.gifting = economy.gifting || {
    dayKey: "",
    coinsSent: 0,
    itemsSent: 0,
  };

  if (economy.gifting.dayKey === dayKey) {
    return;
  }

  economy.gifting.dayKey = dayKey;
  economy.gifting.coinsSent = 0;
  economy.gifting.itemsSent = 0;
}

function applyPlayerEffects(playerProfile, effect = {}, scale = 1) {
  const effects = {
    hunger: 0,
    affection: 0,
    hp: 0,
    social: 0,
    xp: 0,
    leveledUp: false,
    newLevel: playerProfile.level,
  };

  if (effect.hunger) {
    const before = playerProfile.hunger;
    playerProfile.hunger = clampStat(playerProfile.hunger + roundScaled(effect.hunger, scale));
    effects.hunger = playerProfile.hunger - before;
  }

  if (effect.affection) {
    const before = playerProfile.affection;
    playerProfile.affection = clampStat(
      playerProfile.affection + roundScaled(effect.affection, scale)
    );
    effects.affection = playerProfile.affection - before;
  }

  if (effect.hp) {
    const before = playerProfile.hp;
    playerProfile.hp = clampStat(playerProfile.hp + roundScaled(effect.hp, scale));
    effects.hp = playerProfile.hp - before;
  }

  if (effect.social && effect.social < 0) {
    const before = playerProfile.social || 0;
    playerProfile.social = clampStat((playerProfile.social || 0) + roundScaled(effect.social, scale));
    effects.social = playerProfile.social - before;
  }

  if (effect.xp) {
    const granted = roundScaled(effect.xp, scale);
    playerProfile.xp += granted;
    effects.xp = granted;

    const progression = applyLevelProgression(playerProfile.level, playerProfile.xp);
    playerProfile.level = progression.level;
    playerProfile.xp = progression.xp;
    effects.leveledUp = progression.leveledUp;
    effects.newLevel = playerProfile.level;
  }

  return effects;
}

async function buyItem(userId, itemId, quantity = 1) {
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const item = SHOP_ITEMS[itemId];

  if (!item) {
    return {
      ok: false,
      reason: "unknown-item",
    };
  }

  const economy = await ensureEconomy(userId);
  const totalCost = item.cost * safeQuantity;

  if (economy.starCoins < totalCost) {
    return {
      ok: false,
      reason: "insufficient-funds",
      required: totalCost,
      current: economy.starCoins,
      item,
    };
  }

  economy.starCoins -= totalCost;
  const currentCount = getInventoryCount(economy.inventory, item.id);
  setInventoryCount(economy.inventory, item.id, currentCount + safeQuantity);
  await playerEconomyRepository.saveEconomy(economy);

  return {
    ok: true,
    item,
    quantity: safeQuantity,
    cost: totalCost,
    economy,
  };
}

async function useItem(userId, itemId, playerProfile) {
  const item = SHOP_ITEMS[itemId];
  if (!item) {
    return {
      ok: false,
      reason: "unknown-item",
    };
  }

  if (!item.useContexts.includes("direct")) {
    return {
      ok: false,
      reason: item.category === ITEM_CATEGORIES.TOY ? "toy-during-play" : "unsupported-context",
      item,
    };
  }

  const economy = await ensureEconomy(userId);
  const count = getInventoryCount(economy.inventory, item.id);

  if (count < 1) {
    return {
      ok: false,
      reason: "missing-item",
      item,
    };
  }

  setInventoryCount(economy.inventory, item.id, count - 1);
  const effects = applyPlayerEffects(playerProfile, item.effect, 1);
  await playerEconomyRepository.saveEconomy(economy);

  return {
    ok: true,
    item,
    economy,
    effects,
    playerProfile,
  };
}

async function useToyForPlay(userId, itemId, playerProfile, now = new Date()) {
  const item = SHOP_ITEMS[itemId];
  if (!item) {
    return {
      ok: false,
      reason: "unknown-item",
    };
  }

  if (!item.useContexts.includes("play")) {
    return {
      ok: false,
      reason: "invalid-toy",
      item,
    };
  }

  const economy = await ensureEconomy(userId);
  const count = getInventoryCount(economy.inventory, item.id);
  if (count < 1) {
    return {
      ok: false,
      reason: "missing-item",
      item,
    };
  }

  economy.lastToyUse = economy.lastToyUse || new Map();
  const lastUsedAt = economy.lastToyUse.get(item.id);
  const usedRecently =
    lastUsedAt &&
    now.getTime() - new Date(lastUsedAt).getTime() < 2 * 60 * 60 * 1000;

  const scale = usedRecently ? 0.6 : 1;
  const effects = applyPlayerEffects(playerProfile, item.effect, scale);

  setInventoryCount(economy.inventory, item.id, count - 1);
  economy.lastToyUse.set(item.id, now);
  await playerEconomyRepository.saveEconomy(economy);

  return {
    ok: true,
    item,
    effects,
    economy,
    fatigueApplied: usedRecently,
  };
}

async function consumeAdventureSupportItem(userId, itemId) {
  if (!itemId) {
    return {
      ok: true,
      item: null,
      mitigation: 0,
      rewardBoost: 0,
    };
  }

  const item = SHOP_ITEMS[itemId];
  if (!item) {
    return {
      ok: false,
      reason: "unknown-item",
    };
  }

  if (!item.useContexts.includes("adventure")) {
    return {
      ok: false,
      reason: "invalid-support-item",
      item,
    };
  }

  const economy = await ensureEconomy(userId);
  const count = getInventoryCount(economy.inventory, item.id);
  if (count < 1) {
    return {
      ok: false,
      reason: "missing-item",
      item,
    };
  }

  setInventoryCount(economy.inventory, item.id, count - 1);
  await playerEconomyRepository.saveEconomy(economy);

  return {
    ok: true,
    item,
    mitigation: item.effect.adventureMitigation || 0,
    rewardBoost: item.effect.adventureRewardBoost || 0,
  };
}

async function addItemsToInventory(userId, rewards = {}) {
  const economy = await ensureEconomy(userId);
  for (const [itemId, quantity] of Object.entries(rewards)) {
    const safeQuantity = Math.max(0, Number(quantity) || 0);
    if (safeQuantity < 1 || !SHOP_ITEMS[itemId]) {
      continue;
    }

    const existing = getInventoryCount(economy.inventory, itemId);
    setInventoryCount(economy.inventory, itemId, existing + safeQuantity);
  }
  await playerEconomyRepository.saveEconomy(economy);
  return economy;
}

async function transferCoins(fromUserId, toUserId, amount, now = new Date()) {
  const safeAmount = Math.max(1, Number(amount) || 0);
  if (!safeAmount) {
    return {
      ok: false,
      reason: "invalid-amount",
    };
  }

  if (fromUserId === toUserId) {
    return {
      ok: false,
      reason: "self-transfer",
    };
  }

  const [source, target] = await Promise.all([
    ensureEconomy(fromUserId),
    ensureEconomy(toUserId),
  ]);

  const dayKey = getDayKeyInTimeZone(now, "UTC");
  resetGiftWindowIfNeeded(source, dayKey);
  if (source.gifting.coinsSent + safeAmount > env.giftDailyCoinCap) {
    return {
      ok: false,
      reason: "daily-cap",
      remaining: Math.max(0, env.giftDailyCoinCap - source.gifting.coinsSent),
    };
  }

  const fee = Math.ceil((safeAmount * env.giftTransferFeePercent) / 100);
  const totalDebit = safeAmount + fee;
  if (source.starCoins < totalDebit) {
    return {
      ok: false,
      reason: "insufficient-funds",
      required: totalDebit,
      current: source.starCoins,
      fee,
    };
  }

  source.starCoins -= totalDebit;
  target.starCoins += safeAmount;
  source.gifting.coinsSent += safeAmount;

  await Promise.all([
    playerEconomyRepository.saveEconomy(source),
    playerEconomyRepository.saveEconomy(target),
  ]);

  return {
    ok: true,
    amount: safeAmount,
    fee,
    source,
    target,
  };
}

async function transferItem(fromUserId, toUserId, itemId, quantity = 1, now = new Date()) {
  const safeQuantity = Math.max(1, Number(quantity) || 0);
  if (!safeQuantity) {
    return {
      ok: false,
      reason: "invalid-amount",
    };
  }

  if (fromUserId === toUserId) {
    return {
      ok: false,
      reason: "self-transfer",
    };
  }

  const item = SHOP_ITEMS[itemId];
  if (!item) {
    return {
      ok: false,
      reason: "unknown-item",
    };
  }

  if (item.tradable === false) {
    return {
      ok: false,
      reason: "non-tradable",
      item,
    };
  }

  const [source, target] = await Promise.all([
    ensureEconomy(fromUserId),
    ensureEconomy(toUserId),
  ]);

  const dayKey = getDayKeyInTimeZone(now, "UTC");
  resetGiftWindowIfNeeded(source, dayKey);
  if (source.gifting.itemsSent + safeQuantity > env.giftDailyItemCap) {
    return {
      ok: false,
      reason: "daily-cap",
      remaining: Math.max(0, env.giftDailyItemCap - source.gifting.itemsSent),
    };
  }

  const available = getInventoryCount(source.inventory, itemId);
  if (available < safeQuantity) {
    return {
      ok: false,
      reason: "missing-item",
      available,
      item,
    };
  }

  setInventoryCount(source.inventory, itemId, available - safeQuantity);
  const existingTargetCount = getInventoryCount(target.inventory, itemId);
  setInventoryCount(target.inventory, itemId, existingTargetCount + safeQuantity);
  source.gifting.itemsSent += safeQuantity;

  await Promise.all([
    playerEconomyRepository.saveEconomy(source),
    playerEconomyRepository.saveEconomy(target),
  ]);

  return {
    ok: true,
    item,
    quantity: safeQuantity,
    source,
    target,
  };
}

module.exports = {
  ITEM_CATEGORIES,
  SHOP_ITEMS,
  addItemsToInventory,
  applyPlayerEffects,
  buyItem,
  consumeAdventureSupportItem,
  ensureEconomy,
  getEconomy,
  getItemById,
  getInventoryCount,
  listItemsByContext,
  listShopItems,
  transferCoins,
  transferItem,
  useItem,
  useToyForPlay,
};
