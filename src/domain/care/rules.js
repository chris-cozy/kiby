const { applyLevelProgression } = require("../progression/calculateXpForLevel");

const STATS_MIN = 0;
const STATS_MAX = 100;

const ACTION_CONFIG = {
  feed: {
    cooldownMinutes: 10,
    hungerRange: [8, 12],
    xpRange: [5, 15],
  },
  pet: {
    cooldownMinutes: 5,
    affectionRange: [4, 6],
    xpRange: [5, 15],
  },
  play: {
    cooldownMinutes: 10,
    affectionRange: [6, 10],
    xpRange: [10, 20],
  },
};

const DECAY_RULES = {
  hungerLossRange: [2, 4],
  affectionLossRange: [1, 2],
  hpDrainRange: [5, 7],
  hpGainRange: [2, 3],
};

function clamp(value, min = STATS_MIN, max = STATS_MAX) {
  return Math.min(max, Math.max(min, value));
}

function randomInt(min, max) {
  const floor = Math.ceil(min);
  const ceiling = Math.floor(max);
  return Math.floor(Math.random() * (ceiling - floor + 1)) + floor;
}

function getActionCooldownMs(actionName) {
  const action = ACTION_CONFIG[actionName];
  if (!action) {
    return 0;
  }

  return action.cooldownMinutes * 60 * 1000;
}

function applyCareAction(profile, actionName, now = new Date(), rng = randomInt) {
  const actionConfig = ACTION_CONFIG[actionName];
  if (!actionConfig) {
    throw new Error(`Unsupported action: ${actionName}`);
  }

  const actionTimestamp = profile.lastCare?.[actionName]
    ? new Date(profile.lastCare[actionName]).getTime()
    : 0;
  const nowTimestamp = now.getTime();
  const cooldownMs = getActionCooldownMs(actionName);

  if (actionName === "feed" && profile.hunger >= STATS_MAX) {
    return {
      ok: false,
      reason: "full",
    };
  }

  if (actionTimestamp && nowTimestamp - actionTimestamp < cooldownMs) {
    return {
      ok: false,
      reason: "cooldown",
      waitMs: cooldownMs - (nowTimestamp - actionTimestamp),
      cooldownMinutes: actionConfig.cooldownMinutes,
    };
  }

  const updates = {
    hungerGranted: 0,
    affectionGranted: 0,
    xpGranted: 0,
    leveledUp: false,
    newLevel: profile.level,
  };

  if (actionConfig.hungerRange) {
    const granted = rng(actionConfig.hungerRange[0], actionConfig.hungerRange[1]);
    const nextValue = clamp(profile.hunger + granted);
    updates.hungerGranted = nextValue - profile.hunger;
    profile.hunger = nextValue;
  }

  if (actionConfig.affectionRange) {
    const granted = rng(
      actionConfig.affectionRange[0],
      actionConfig.affectionRange[1]
    );
    const nextValue = clamp(profile.affection + granted);
    updates.affectionGranted = nextValue - profile.affection;
    profile.affection = nextValue;
  }

  const xpGranted = rng(actionConfig.xpRange[0], actionConfig.xpRange[1]);
  profile.xp += xpGranted;
  updates.xpGranted = xpGranted;

  const progression = applyLevelProgression(profile.level, profile.xp);
  profile.level = progression.level;
  profile.xp = progression.xp;
  updates.leveledUp = progression.leveledUp;
  updates.newLevel = profile.level;

  profile.lastCare = profile.lastCare || {};
  profile.lastCare[actionName] = now;

  return {
    ok: true,
    updates,
  };
}

function applyDecay(profile, options = {}) {
  const now = options.now || new Date();
  const thresholdMs = options.neglectThresholdMs || 60 * 60 * 1000;
  const notificationThreshold = options.notificationThreshold || 30;
  const rng = options.rng || randomInt;

  const previous = {
    hunger: profile.hunger,
    affection: profile.affection,
    hp: profile.hp,
  };

  const nowMs = now.getTime();

  const lastFeed = profile.lastCare?.feed
    ? new Date(profile.lastCare.feed).getTime()
    : 0;
  const lastPet = profile.lastCare?.pet
    ? new Date(profile.lastCare.pet).getTime()
    : 0;
  const lastPlay = profile.lastCare?.play
    ? new Date(profile.lastCare.play).getTime()
    : 0;

  if (lastFeed && nowMs - lastFeed > thresholdMs) {
    profile.hunger = clamp(
      profile.hunger - rng(DECAY_RULES.hungerLossRange[0], DECAY_RULES.hungerLossRange[1])
    );
  }

  if ((lastPet && nowMs - lastPet > thresholdMs) || (lastPlay && nowMs - lastPlay > thresholdMs)) {
    profile.affection = clamp(
      profile.affection -
        rng(DECAY_RULES.affectionLossRange[0], DECAY_RULES.affectionLossRange[1])
    );
  }

  if (profile.hunger === STATS_MIN || profile.affection === STATS_MIN) {
    profile.hp = clamp(
      profile.hp - rng(DECAY_RULES.hpDrainRange[0], DECAY_RULES.hpDrainRange[1])
    );
  }

  if (profile.hunger === STATS_MAX && profile.affection === STATS_MAX) {
    profile.hp = clamp(profile.hp + rng(DECAY_RULES.hpGainRange[0], DECAY_RULES.hpGainRange[1]));
  }

  const events = {
    hungerDroppedBelowThreshold:
      previous.hunger >= notificationThreshold && profile.hunger < notificationThreshold,
    affectionDroppedBelowThreshold:
      previous.affection >= notificationThreshold &&
      profile.affection < notificationThreshold,
    hpChanged: previous.hp !== profile.hp,
    died: previous.hp > 0 && profile.hp === 0,
  };

  return {
    profile,
    events,
  };
}

module.exports = {
  ACTION_CONFIG,
  STATS_MAX,
  STATS_MIN,
  applyCareAction,
  applyDecay,
  clamp,
  getActionCooldownMs,
  randomInt,
};
