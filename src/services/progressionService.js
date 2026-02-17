const playerProgressRepository = require("../repositories/playerProgressRepository");
const economyService = require("./economyService");
const sleepService = require("./sleepService");
const {
  getDayKeyInTimeZone,
  getSecondsUntilLocalMidnight,
} = require("../utils/timezoneDayKey");

const DAILY_REWARD_COINS = 20;
const MAX_STREAK_SHIELD = 1;
const STREAK_SHIELD_REFILL_DAYS = 7;

const QUEST_POOL = [
  {
    key: "feed-focus",
    label: "Feed your Kiby",
    category: "care",
    metric: "feed",
    goal: 3,
    rewardCoins: 25,
  },
  {
    key: "pet-patrol",
    label: "Pet your Kiby",
    category: "care",
    metric: "pet",
    goal: 5,
    rewardCoins: 25,
  },
  {
    key: "play-session",
    label: "Play with your Kiby",
    category: "care",
    metric: "play",
    goal: 3,
    rewardCoins: 30,
  },
  {
    key: "cuddle-comfort",
    label: "Use cuddle interactions",
    category: "care",
    metric: "cuddle",
    goal: 3,
    rewardCoins: 30,
  },
  {
    key: "train-climb",
    label: "Run training sessions",
    category: "care",
    metric: "train",
    goal: 2,
    rewardCoins: 35,
  },
  {
    key: "bath-bonus",
    label: "Give your Kiby a bath",
    category: "care",
    metric: "bathe",
    goal: 2,
    rewardCoins: 30,
  },
  {
    key: "social-reach",
    label: "Use social play",
    category: "social",
    metric: "socialPlay",
    goal: 3,
    rewardCoins: 35,
  },
  {
    key: "item-user",
    label: "Use items from inventory",
    category: "economy",
    metric: "useItem",
    goal: 2,
    rewardCoins: 30,
  },
  {
    key: "coin-giver",
    label: "Gift Star Coins",
    category: "economy",
    metric: "coinsGifted",
    goal: 1,
    rewardCoins: 30,
  },
  {
    key: "item-giver",
    label: "Gift an item",
    category: "economy",
    metric: "itemsGifted",
    goal: 1,
    rewardCoins: 30,
  },
];

const BONUS_QUEST_POOL = [
  {
    key: "deep-care",
    label: "Complete 8 care actions",
    category: "bonus",
    metric: "careActions",
    goal: 8,
    rewardCoins: 70,
  },
  {
    key: "social-weekender",
    label: "Complete 5 social plays",
    category: "bonus",
    metric: "socialPlay",
    goal: 5,
    rewardCoins: 80,
  },
  {
    key: "shop-cycler",
    label: "Use 4 inventory items",
    category: "bonus",
    metric: "useItem",
    goal: 4,
    rewardCoins: 75,
  },
];

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function toQuestEntry(definition) {
  return {
    key: definition.key,
    label: definition.label,
    category: definition.category,
    goal: definition.goal,
    rewardCoins: definition.rewardCoins,
    progress: 0,
    completed: false,
    claimedAt: null,
  };
}

function pickDistinctFromPool(pool, seed, count) {
  const picks = [];
  const used = new Set();

  let offset = 0;
  while (picks.length < count && used.size < pool.length) {
    const index = (seed + offset * 7) % pool.length;
    if (!used.has(index)) {
      picks.push(pool[index]);
      used.add(index);
    }
    offset += 1;
  }

  return picks;
}

function buildDailyQuestBoard(userId, dayKey) {
  const seed = hashString(`${userId}:${dayKey}`);
  const picked = pickDistinctFromPool(QUEST_POOL, seed, 3);
  const bonus = BONUS_QUEST_POOL[seed % BONUS_QUEST_POOL.length];

  return {
    quests: picked.map((quest) => toQuestEntry(quest)),
    bonusQuest: toQuestEntry(bonus),
    rerollsRemaining: 1,
    refreshedAt: new Date(),
    dayKey,
  };
}

function ensureNumber(value, fallback = 0) {
  if (Number.isFinite(value)) {
    return value;
  }

  return fallback;
}

function ensureActionCounters(progress) {
  const target = progress.dailyActionCounts || {};
  const keys = [
    "feed",
    "pet",
    "play",
    "cuddle",
    "train",
    "bathe",
    "socialPlay",
    "useItem",
    "coinsGifted",
    "itemsGifted",
  ];

  for (const key of keys) {
    target[key] = ensureNumber(target[key], 0);
  }

  if (!target.refreshedAt) {
    target.refreshedAt = new Date();
  }

  progress.dailyActionCounts = target;
}

function resetActionCounters(progress, now = new Date()) {
  ensureActionCounters(progress);
  progress.dailyActionCounts.feed = 0;
  progress.dailyActionCounts.pet = 0;
  progress.dailyActionCounts.play = 0;
  progress.dailyActionCounts.cuddle = 0;
  progress.dailyActionCounts.train = 0;
  progress.dailyActionCounts.bathe = 0;
  progress.dailyActionCounts.socialPlay = 0;
  progress.dailyActionCounts.useItem = 0;
  progress.dailyActionCounts.coinsGifted = 0;
  progress.dailyActionCounts.itemsGifted = 0;
  progress.dailyActionCounts.refreshedAt = now;
}

function ensureLifetime(progress) {
  progress.lifetime = progress.lifetime || {};
  progress.lifetime.careActions = ensureNumber(progress.lifetime.careActions, 0);
  progress.lifetime.dailyClaims = ensureNumber(progress.lifetime.dailyClaims, 0);
  progress.lifetime.questClaims = ensureNumber(progress.lifetime.questClaims, 0);
  progress.lifetime.socialActions = ensureNumber(progress.lifetime.socialActions, 0);
  progress.lifetime.adventuresCompleted = ensureNumber(
    progress.lifetime.adventuresCompleted,
    0
  );
  progress.lifetime.coinsGifted = ensureNumber(progress.lifetime.coinsGifted, 0);
  progress.lifetime.itemsGifted = ensureNumber(progress.lifetime.itemsGifted, 0);
  progress.lifetime.worldEventContributions = ensureNumber(
    progress.lifetime.worldEventContributions,
    0
  );
}

function ensureProgressShape(progress) {
  progress.dailyStreak = ensureNumber(progress.dailyStreak, 0);
  progress.streakShieldCharges = Math.min(
    MAX_STREAK_SHIELD,
    Math.max(0, ensureNumber(progress.streakShieldCharges, 1))
  );
  progress.streakShieldLastGrantedAt =
    progress.streakShieldLastGrantedAt || new Date();
  progress.lastDailyClaimAt = progress.lastDailyClaimAt || null;

  ensureActionCounters(progress);
  ensureLifetime(progress);

  progress.titles = progress.titles || {};
  progress.titles.unlocked = Array.isArray(progress.titles.unlocked)
    ? progress.titles.unlocked
    : [];
  progress.titles.equipped = progress.titles.equipped || "";

  progress.revive = progress.revive || {};
  progress.revive.tokens = ensureNumber(progress.revive.tokens, 1);
  progress.revive.totalRevives = ensureNumber(progress.revive.totalRevives, 0);

  progress.socialMemory = progress.socialMemory || {};
  progress.socialMemory.dayKey = progress.socialMemory.dayKey || "";
  const rawOneWayByTarget = progress.socialMemory.oneWayByTarget;
  if (!rawOneWayByTarget || typeof rawOneWayByTarget.get !== "function") {
    progress.socialMemory.oneWayByTarget = new Map(
      Object.entries(rawOneWayByTarget || {})
    );
  }
  progress.socialMemory.lastTargetId = progress.socialMemory.lastTargetId || "";
  progress.socialMemory.lastInteractedAt =
    progress.socialMemory.lastInteractedAt || null;

  progress.ambient = progress.ambient || {};
  progress.ambient.lastSentAt = progress.ambient.lastSentAt || null;

  progress.globalEvents = progress.globalEvents || {};
  progress.globalEvents.claimedEventIds = Array.isArray(
    progress.globalEvents.claimedEventIds
  )
    ? progress.globalEvents.claimedEventIds
    : [];
}

async function getUserTimeZone(userId) {
  const schedule = await sleepService.getScheduleForUser(userId);
  return schedule.timezone || "UTC";
}

function getDayDifference(dayKeyA, dayKeyB) {
  const dateA = new Date(`${dayKeyA}T00:00:00.000Z`);
  const dateB = new Date(`${dayKeyB}T00:00:00.000Z`);
  return Math.round((dateB.getTime() - dateA.getTime()) / (24 * 60 * 60 * 1000));
}

function buildLegacyQuestBoardIfNeeded(progress, userId, dayKey) {
  if (progress.questBoard && Array.isArray(progress.questBoard.quests)) {
    return;
  }

  progress.questBoard = buildDailyQuestBoard(userId, dayKey);
}

function refreshDailyQuestBoard(progress, userId, dayKey, now = new Date()) {
  progress.questBoard = buildDailyQuestBoard(userId, dayKey);
  progress.questBoard.refreshedAt = now;
  resetActionCounters(progress, now);
}

function maybeRefillStreakShield(progress, now = new Date()) {
  if (progress.streakShieldCharges >= MAX_STREAK_SHIELD) {
    return false;
  }

  const lastGrantedAt = new Date(progress.streakShieldLastGrantedAt).getTime();
  if (now.getTime() - lastGrantedAt < STREAK_SHIELD_REFILL_DAYS * 24 * 60 * 60 * 1000) {
    return false;
  }

  progress.streakShieldCharges = MAX_STREAK_SHIELD;
  progress.streakShieldLastGrantedAt = now;
  return true;
}

function getMetricCount(progress, metricKey) {
  if (metricKey === "careActions") {
    const counts = progress.dailyActionCounts || {};
    return (
      ensureNumber(counts.feed, 0) +
      ensureNumber(counts.pet, 0) +
      ensureNumber(counts.play, 0) +
      ensureNumber(counts.cuddle, 0) +
      ensureNumber(counts.train, 0) +
      ensureNumber(counts.bathe, 0)
    );
  }

  return ensureNumber(progress.dailyActionCounts?.[metricKey], 0);
}

function markQuestProgress(quest, metricKey, metricValue) {
  if (!quest || quest.completed || quest.claimedAt) {
    return;
  }

  const source = [...QUEST_POOL, ...BONUS_QUEST_POOL].find(
    (entry) => entry.key === quest.key
  );
  if (!source) {
    return;
  }

  if (source.metric !== metricKey && !(source.metric === "careActions" && metricKey)) {
    return;
  }

  quest.progress = Math.min(quest.goal, metricValue);
  if (quest.progress >= quest.goal) {
    quest.completed = true;
  }
}

function getAllQuests(progress) {
  const quests = [];
  (progress.questBoard.quests || []).forEach((quest, index) => {
    quests.push({
      kind: "daily",
      index,
      quest,
    });
  });
  quests.push({
    kind: "bonus",
    index: -1,
    quest: progress.questBoard.bonusQuest,
  });
  return quests;
}

async function ensureProgress(userId, now = new Date()) {
  let progress = await playerProgressRepository.findByUserId(userId);
  const timezone = await getUserTimeZone(userId);
  const dayKey = getDayKeyInTimeZone(now, timezone);
  let changed = false;

  if (!progress) {
    progress = await playerProgressRepository.upsertByUserId(userId, {
      dailyStreak: 0,
      streakShieldCharges: 1,
      streakShieldLastGrantedAt: now,
      lastDailyClaimAt: null,
      questBoard: buildDailyQuestBoard(userId, dayKey),
      dailyActionCounts: {
        feed: 0,
        pet: 0,
        play: 0,
        cuddle: 0,
        train: 0,
        bathe: 0,
        socialPlay: 0,
        useItem: 0,
        coinsGifted: 0,
        itemsGifted: 0,
        refreshedAt: now,
      },
      lifetime: {
        careActions: 0,
        dailyClaims: 0,
        questClaims: 0,
        socialActions: 0,
        adventuresCompleted: 0,
        coinsGifted: 0,
        itemsGifted: 0,
        worldEventContributions: 0,
      },
      titles: {
        unlocked: [],
        equipped: "",
      },
      revive: {
        tokens: 1,
        totalRevives: 0,
      },
      socialMemory: {
        dayKey,
        oneWayByTarget: {},
        lastTargetId: "",
        lastInteractedAt: null,
      },
      ambient: {
        lastSentAt: null,
      },
      globalEvents: {
        claimedEventIds: [],
      },
    });
  }

  ensureProgressShape(progress);
  buildLegacyQuestBoardIfNeeded(progress, userId, dayKey);

  if (progress.questBoard.dayKey !== dayKey) {
    refreshDailyQuestBoard(progress, userId, dayKey, now);
    changed = true;
  }

  if (maybeRefillStreakShield(progress, now)) {
    changed = true;
  }

  if (changed) {
    await playerProgressRepository.saveProgress(progress);
  }

  return {
    progress,
    timezone,
    dayKey,
  };
}

function updateDailyMetric(progress, metricKey, amount) {
  ensureActionCounters(progress);
  if (!Object.prototype.hasOwnProperty.call(progress.dailyActionCounts, metricKey)) {
    return;
  }

  progress.dailyActionCounts[metricKey] = Math.max(
    0,
    ensureNumber(progress.dailyActionCounts[metricKey], 0) + amount
  );
}

function updateQuestsForMetric(progress, metricKey) {
  const metricValue = getMetricCount(progress, metricKey);
  for (const entry of getAllQuests(progress)) {
    markQuestProgress(entry.quest, metricKey, metricValue);
  }

  if (metricKey !== "careActions") {
    const careValue = getMetricCount(progress, "careActions");
    for (const entry of getAllQuests(progress)) {
      markQuestProgress(entry.quest, "careActions", careValue);
    }
  }
}

async function recordMetric(userId, metricKey, amount = 1, now = new Date()) {
  const { progress } = await ensureProgress(userId, now);
  ensureLifetime(progress);

  updateDailyMetric(progress, metricKey, amount);
  updateQuestsForMetric(progress, metricKey);

  await playerProgressRepository.saveProgress(progress);
  return progress;
}

async function recordCareAction(userId, actionName, now = new Date()) {
  const { progress } = await ensureProgress(userId, now);
  ensureLifetime(progress);

  updateDailyMetric(progress, actionName, 1);
  progress.lifetime.careActions += 1;
  updateQuestsForMetric(progress, actionName);

  await playerProgressRepository.saveProgress(progress);
  return progress;
}

async function recordItemUse(userId, now = new Date()) {
  const { progress } = await ensureProgress(userId, now);
  updateDailyMetric(progress, "useItem", 1);
  updateQuestsForMetric(progress, "useItem");
  await playerProgressRepository.saveProgress(progress);
  return progress;
}

async function recordGiftAction(
  userId,
  { coinsAmount = 0, itemQuantity = 0 } = {},
  now = new Date()
) {
  const { progress } = await ensureProgress(userId, now);
  ensureLifetime(progress);

  if (coinsAmount > 0) {
    updateDailyMetric(progress, "coinsGifted", coinsAmount);
    progress.lifetime.coinsGifted += coinsAmount;
    updateQuestsForMetric(progress, "coinsGifted");
  }

  if (itemQuantity > 0) {
    updateDailyMetric(progress, "itemsGifted", itemQuantity);
    progress.lifetime.itemsGifted += itemQuantity;
    updateQuestsForMetric(progress, "itemsGifted");
  }

  await playerProgressRepository.saveProgress(progress);
  return progress;
}

async function recordSocialAction(userId, amount = 1, now = new Date()) {
  const { progress } = await ensureProgress(userId, now);
  ensureLifetime(progress);

  updateDailyMetric(progress, "socialPlay", amount);
  progress.lifetime.socialActions += amount;
  updateQuestsForMetric(progress, "socialPlay");

  await playerProgressRepository.saveProgress(progress);
  return progress;
}

async function recordAdventureCompletion(userId, now = new Date()) {
  const { progress } = await ensureProgress(userId, now);
  ensureLifetime(progress);
  progress.lifetime.adventuresCompleted += 1;
  await playerProgressRepository.saveProgress(progress);
  return progress;
}

async function recordWorldEventContribution(userId, amount = 1, now = new Date()) {
  const { progress } = await ensureProgress(userId, now);
  ensureLifetime(progress);
  progress.lifetime.worldEventContributions += amount;
  await playerProgressRepository.saveProgress(progress);
  return progress;
}

function serializeQuestStatus(progress) {
  return {
    quests: (progress.questBoard.quests || []).map((quest, index) => ({
      id: `slot-${index + 1}`,
      key: quest.key,
      label: quest.label,
      category: quest.category,
      goal: quest.goal,
      progress: quest.progress,
      rewardCoins: quest.rewardCoins,
      completed: quest.completed,
      claimed: Boolean(quest.claimedAt),
    })),
    bonusQuest: {
      id: "bonus",
      key: progress.questBoard.bonusQuest.key,
      label: progress.questBoard.bonusQuest.label,
      category: progress.questBoard.bonusQuest.category,
      goal: progress.questBoard.bonusQuest.goal,
      progress: progress.questBoard.bonusQuest.progress,
      rewardCoins: progress.questBoard.bonusQuest.rewardCoins,
      completed: progress.questBoard.bonusQuest.completed,
      claimed: Boolean(progress.questBoard.bonusQuest.claimedAt),
    },
  };
}

async function getQuestStatus(userId, now = new Date()) {
  const { progress, timezone } = await ensureProgress(userId, now);
  const resetInSeconds = getSecondsUntilLocalMidnight(now, timezone);
  const serialized = serializeQuestStatus(progress);

  return {
    timezone,
    dailyStreak: progress.dailyStreak,
    streakShieldCharges: progress.streakShieldCharges,
    rerollsRemaining: progress.questBoard.rerollsRemaining,
    resetInSeconds,
    quests: serialized.quests,
    bonusQuest: serialized.bonusQuest,
    actionCounts: {
      feed: progress.dailyActionCounts.feed,
      pet: progress.dailyActionCounts.pet,
      play: progress.dailyActionCounts.play,
      cuddle: progress.dailyActionCounts.cuddle,
      train: progress.dailyActionCounts.train,
      bathe: progress.dailyActionCounts.bathe,
      socialPlay: progress.dailyActionCounts.socialPlay,
      useItem: progress.dailyActionCounts.useItem,
      coinsGifted: progress.dailyActionCounts.coinsGifted,
      itemsGifted: progress.dailyActionCounts.itemsGifted,
    },
  };
}

function getQuestBySelector(progress, selector) {
  if (!selector) {
    return getAllQuests(progress).find(
      (entry) => entry.quest.completed && !entry.quest.claimedAt
    );
  }

  if (selector === "bonus") {
    return {
      kind: "bonus",
      index: -1,
      quest: progress.questBoard.bonusQuest,
    };
  }

  if (selector.startsWith("slot-")) {
    const index = Number.parseInt(selector.split("-")[1], 10) - 1;
    if (Number.isNaN(index) || index < 0 || index >= progress.questBoard.quests.length) {
      return null;
    }
    return {
      kind: "daily",
      index,
      quest: progress.questBoard.quests[index],
    };
  }

  return getAllQuests(progress).find((entry) => entry.quest.key === selector) || null;
}

async function claimQuestReward(userId, selector, now = new Date()) {
  const { progress } = await ensureProgress(userId, now);
  const economy = await economyService.ensureEconomy(userId);
  const selected = getQuestBySelector(progress, selector);

  if (!selected) {
    return {
      ok: false,
      reason: "quest-not-found",
      progress,
      economy,
    };
  }

  const quest = selected.quest;
  if (!quest.completed) {
    return {
      ok: false,
      reason: "quest-incomplete",
      progress,
      economy,
    };
  }

  if (quest.claimedAt) {
    return {
      ok: false,
      reason: "already-claimed",
      progress,
      economy,
    };
  }

  quest.claimedAt = now;
  economy.starCoins += quest.rewardCoins;
  progress.lifetime.questClaims += 1;

  await Promise.all([
    playerProgressRepository.saveProgress(progress),
    economy.save(),
  ]);

  return {
    ok: true,
    reward: quest.rewardCoins,
    quest: {
      key: quest.key,
      label: quest.label,
    },
    progress,
    economy,
  };
}

async function claimDailyReward(userId, now = new Date()) {
  const { progress, timezone } = await ensureProgress(userId, now);
  const economy = await economyService.ensureEconomy(userId);
  const currentDay = getDayKeyInTimeZone(now, timezone);
  const claimDay = progress.lastDailyClaimAt
    ? getDayKeyInTimeZone(progress.lastDailyClaimAt, timezone)
    : null;

  if (claimDay === currentDay) {
    return {
      ok: false,
      reason: "already-claimed",
      progress,
      economy,
      timezone,
    };
  }

  if (!claimDay) {
    progress.dailyStreak = 1;
  } else {
    const dayDiff = getDayDifference(claimDay, currentDay);
    if (dayDiff === 1) {
      progress.dailyStreak += 1;
    } else if (dayDiff === 2 && progress.streakShieldCharges > 0) {
      progress.dailyStreak += 1;
      progress.streakShieldCharges -= 1;
    } else {
      progress.dailyStreak = 1;
    }
  }

  const streakBonus = Math.min(40, progress.dailyStreak * 2);
  const reward = DAILY_REWARD_COINS + streakBonus;
  progress.lastDailyClaimAt = now;
  progress.lifetime.dailyClaims += 1;
  economy.starCoins += reward;

  await Promise.all([
    playerProgressRepository.saveProgress(progress),
    economy.save(),
  ]);

  return {
    ok: true,
    reward,
    streak: progress.dailyStreak,
    streakShieldCharges: progress.streakShieldCharges,
    timezone,
    resetInSeconds: getSecondsUntilLocalMidnight(now, timezone),
    economy,
  };
}

function pickReplacementQuest(progress, userId, now = new Date()) {
  const dayKey = progress.questBoard.dayKey || getDayKeyInTimeZone(now, "UTC");
  const existing = new Set(progress.questBoard.quests.map((quest) => quest.key));
  const seed = hashString(`${userId}:${dayKey}:${progress.questBoard.rerollsRemaining}`);

  for (let index = 0; index < QUEST_POOL.length; index += 1) {
    const candidate = QUEST_POOL[(seed + index * 5) % QUEST_POOL.length];
    if (!existing.has(candidate.key)) {
      return candidate;
    }
  }

  return QUEST_POOL[seed % QUEST_POOL.length];
}

async function rerollQuest(userId, slot = 1, now = new Date()) {
  const { progress } = await ensureProgress(userId, now);

  if (progress.questBoard.rerollsRemaining < 1) {
    return {
      ok: false,
      reason: "no-rerolls",
      progress,
    };
  }

  const index = Math.max(1, Number(slot) || 1) - 1;
  if (index >= progress.questBoard.quests.length) {
    return {
      ok: false,
      reason: "invalid-slot",
      progress,
    };
  }

  const replacement = pickReplacementQuest(progress, userId, now);
  progress.questBoard.quests[index] = toQuestEntry(replacement);
  progress.questBoard.rerollsRemaining -= 1;
  await playerProgressRepository.saveProgress(progress);

  return {
    ok: true,
    slot: index + 1,
    quest: progress.questBoard.quests[index],
    rerollsRemaining: progress.questBoard.rerollsRemaining,
  };
}

function getOneWayTargetCount(progress, targetUserId, dayKey) {
  progress.socialMemory = progress.socialMemory || {};
  progress.socialMemory.oneWayByTarget =
    progress.socialMemory.oneWayByTarget || new Map();

  if (progress.socialMemory.dayKey !== dayKey) {
    progress.socialMemory.dayKey = dayKey;
    progress.socialMemory.oneWayByTarget = new Map();
  }

  return ensureNumber(progress.socialMemory.oneWayByTarget.get(targetUserId), 0);
}

async function registerOneWaySocialTarget(userId, targetUserId, now = new Date()) {
  const { progress, timezone, dayKey } = await ensureProgress(userId, now);
  const count = getOneWayTargetCount(progress, targetUserId, dayKey);
  progress.socialMemory.oneWayByTarget.set(targetUserId, count + 1);
  progress.socialMemory.lastTargetId = targetUserId;
  progress.socialMemory.lastInteractedAt = now;
  await playerProgressRepository.saveProgress(progress);

  return {
    timezone,
    dayKey,
    countToday: count + 1,
  };
}

async function consumeReviveToken(userId, now = new Date()) {
  const { progress } = await ensureProgress(userId, now);
  progress.revive = progress.revive || {};
  const available = ensureNumber(progress.revive.tokens, 0);

  if (available < 1) {
    return {
      ok: false,
      remaining: 0,
    };
  }

  progress.revive.tokens = available - 1;
  await playerProgressRepository.saveProgress(progress);
  return {
    ok: true,
    remaining: progress.revive.tokens,
  };
}

async function registerRevive(userId, now = new Date()) {
  const { progress } = await ensureProgress(userId, now);
  progress.revive.totalRevives += 1;
  await playerProgressRepository.saveProgress(progress);
  return progress.revive.totalRevives;
}

async function getProgress(userId, now = new Date()) {
  const { progress } = await ensureProgress(userId, now);
  return progress;
}

module.exports = {
  BONUS_QUEST_POOL,
  DAILY_REWARD_COINS,
  QUEST_POOL,
  claimDailyReward,
  claimQuestReward,
  consumeReviveToken,
  ensureProgress,
  getProgress,
  getQuestStatus,
  registerOneWaySocialTarget,
  registerRevive,
  recordAdventureCompletion,
  recordCareAction,
  recordGiftAction,
  recordItemUse,
  recordMetric,
  recordSocialAction,
  recordWorldEventContribution,
  rerollQuest,
};
