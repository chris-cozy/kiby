const playerProgressRepository = require("../repositories/playerProgressRepository");
const economyService = require("./economyService");

const QUEST_DEFINITIONS = [
  {
    key: "feed",
    goal: 3,
    rewardCoins: 25,
  },
  {
    key: "pet",
    goal: 5,
    rewardCoins: 25,
  },
  {
    key: "play",
    goal: 2,
    rewardCoins: 30,
  },
];

const DAILY_REWARD_COINS = 20;

function getUtcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getYesterdayUtcDayKey(date = new Date()) {
  const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  return getUtcDayKey(yesterday);
}

function selectQuestByDay(date = new Date()) {
  const day = date.getUTCDate();
  return QUEST_DEFINITIONS[day % QUEST_DEFINITIONS.length];
}

async function ensureProgress(userId, now = new Date()) {
  let progress = await playerProgressRepository.findByUserId(userId);
  if (!progress) {
    const quest = selectQuestByDay(now);
    progress = await playerProgressRepository.upsertByUserId(userId, {
      dailyStreak: 0,
      quest: {
        ...quest,
        progress: 0,
        completed: false,
        claimedAt: null,
        refreshedAt: now,
      },
      dailyActionCounts: {
        feed: 0,
        pet: 0,
        play: 0,
        refreshedAt: now,
      },
    });
  }

  const currentDay = getUtcDayKey(now);
  const questDay = getUtcDayKey(progress.quest.refreshedAt || now);

  if (questDay !== currentDay) {
    const quest = selectQuestByDay(now);
    progress.quest.key = quest.key;
    progress.quest.goal = quest.goal;
    progress.quest.rewardCoins = quest.rewardCoins;
    progress.quest.progress = 0;
    progress.quest.completed = false;
    progress.quest.claimedAt = null;
    progress.quest.refreshedAt = now;

    progress.dailyActionCounts.feed = 0;
    progress.dailyActionCounts.pet = 0;
    progress.dailyActionCounts.play = 0;
    progress.dailyActionCounts.refreshedAt = now;

    await playerProgressRepository.saveProgress(progress);
  }

  return progress;
}

async function recordCareAction(userId, actionName, now = new Date()) {
  const progress = await ensureProgress(userId, now);
  if (!["feed", "pet", "play"].includes(actionName)) {
    return progress;
  }

  progress.dailyActionCounts[actionName] += 1;

  if (progress.quest.key === actionName && !progress.quest.completed) {
    progress.quest.progress = Math.min(
      progress.quest.goal,
      progress.quest.progress + 1
    );

    if (progress.quest.progress >= progress.quest.goal) {
      progress.quest.completed = true;
    }
  }

  await playerProgressRepository.saveProgress(progress);
  return progress;
}

async function getQuestStatus(userId, now = new Date()) {
  const progress = await ensureProgress(userId, now);

  return {
    dailyStreak: progress.dailyStreak,
    quest: {
      key: progress.quest.key,
      goal: progress.quest.goal,
      progress: progress.quest.progress,
      rewardCoins: progress.quest.rewardCoins,
      completed: progress.quest.completed,
      claimed: Boolean(progress.quest.claimedAt),
    },
    actionCounts: {
      feed: progress.dailyActionCounts.feed,
      pet: progress.dailyActionCounts.pet,
      play: progress.dailyActionCounts.play,
    },
  };
}

async function claimDailyReward(userId, now = new Date()) {
  const progress = await ensureProgress(userId, now);
  const economy = await economyService.ensureEconomy(userId);

  const currentDay = getUtcDayKey(now);
  const claimDay = progress.lastDailyClaimAt
    ? getUtcDayKey(progress.lastDailyClaimAt)
    : null;

  if (claimDay === currentDay) {
    return {
      ok: false,
      reason: "already-claimed",
      progress,
      economy,
    };
  }

  const yesterdayDay = getYesterdayUtcDayKey(now);
  if (claimDay === yesterdayDay) {
    progress.dailyStreak += 1;
  } else {
    progress.dailyStreak = 1;
  }

  const streakBonus = Math.min(30, progress.dailyStreak * 2);
  const reward = DAILY_REWARD_COINS + streakBonus;

  progress.lastDailyClaimAt = now;
  economy.starCoins += reward;

  await Promise.all([
    playerProgressRepository.saveProgress(progress),
    economy.save(),
  ]);

  return {
    ok: true,
    reward,
    streak: progress.dailyStreak,
    economy,
  };
}

async function claimQuestReward(userId, now = new Date()) {
  const progress = await ensureProgress(userId, now);
  const economy = await economyService.ensureEconomy(userId);

  if (!progress.quest.completed) {
    return {
      ok: false,
      reason: "quest-incomplete",
      progress,
      economy,
    };
  }

  if (progress.quest.claimedAt) {
    return {
      ok: false,
      reason: "already-claimed",
      progress,
      economy,
    };
  }

  const reward = progress.quest.rewardCoins;
  progress.quest.claimedAt = now;
  economy.starCoins += reward;

  await Promise.all([
    playerProgressRepository.saveProgress(progress),
    economy.save(),
  ]);

  return {
    ok: true,
    reward,
    progress,
    economy,
  };
}

module.exports = {
  QUEST_DEFINITIONS,
  claimDailyReward,
  claimQuestReward,
  ensureProgress,
  getQuestStatus,
  recordCareAction,
};
