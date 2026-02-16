const playerEconomyRepository = require("../repositories/playerEconomyRepository");
const { applyLevelProgression } = require("../domain/progression/calculateXpForLevel");

const SHOP_ITEMS = {
  food_pack: {
    id: "food_pack",
    label: "Food Pack",
    cost: 20,
    effect: {
      hunger: 20,
    },
    description: "Restores hunger.",
  },
  toy_box: {
    id: "toy_box",
    label: "Toy Box",
    cost: 20,
    effect: {
      affection: 20,
    },
    description: "Boosts affection.",
  },
  health_kit: {
    id: "health_kit",
    label: "Health Kit",
    cost: 30,
    effect: {
      hp: 20,
    },
    description: "Restores HP.",
  },
  star_snack: {
    id: "star_snack",
    label: "Star Snack",
    cost: 50,
    effect: {
      xp: 40,
    },
    description: "Boosts XP progression.",
  },
};

function clampStat(value) {
  return Math.min(100, Math.max(0, value));
}

async function ensureEconomy(userId) {
  return playerEconomyRepository.upsertByUserId(userId);
}

async function getEconomy(userId) {
  return ensureEconomy(userId);
}

function listShopItems() {
  return Object.values(SHOP_ITEMS);
}

function getInventoryCount(inventory, itemId) {
  const rawValue = inventory.get(itemId) || 0;
  return Number(rawValue) || 0;
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
  economy.inventory.set(item.id, currentCount + safeQuantity);
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

  const economy = await ensureEconomy(userId);
  const count = getInventoryCount(economy.inventory, item.id);

  if (count < 1) {
    return {
      ok: false,
      reason: "missing-item",
      item,
    };
  }

  economy.inventory.set(item.id, count - 1);

  const effects = {
    hunger: 0,
    affection: 0,
    hp: 0,
    xp: 0,
    leveledUp: false,
    newLevel: playerProfile.level,
  };

  if (item.effect.hunger) {
    const before = playerProfile.hunger;
    playerProfile.hunger = clampStat(playerProfile.hunger + item.effect.hunger);
    effects.hunger = playerProfile.hunger - before;
  }

  if (item.effect.affection) {
    const before = playerProfile.affection;
    playerProfile.affection = clampStat(
      playerProfile.affection + item.effect.affection
    );
    effects.affection = playerProfile.affection - before;
  }

  if (item.effect.hp) {
    const before = playerProfile.hp;
    playerProfile.hp = clampStat(playerProfile.hp + item.effect.hp);
    effects.hp = playerProfile.hp - before;
  }

  if (item.effect.xp) {
    playerProfile.xp += item.effect.xp;
    effects.xp = item.effect.xp;

    const progression = applyLevelProgression(playerProfile.level, playerProfile.xp);
    playerProfile.level = progression.level;
    playerProfile.xp = progression.xp;
    effects.leveledUp = progression.leveledUp;
    effects.newLevel = playerProfile.level;
  }

  await playerEconomyRepository.saveEconomy(economy);

  return {
    ok: true,
    item,
    economy,
    effects,
    playerProfile,
  };
}

module.exports = {
  SHOP_ITEMS,
  buyItem,
  ensureEconomy,
  getEconomy,
  listShopItems,
  useItem,
};
