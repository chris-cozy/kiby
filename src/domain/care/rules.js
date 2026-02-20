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
    xpRange: [5, 12],
  },
  play: {
    cooldownMinutes: 10,
    affectionRange: [6, 10],
    xpRange: [10, 20],
  },
  cuddle: {
    cooldownMinutes: 8,
    affectionRange: [7, 11],
    xpRange: [8, 14],
  },
  train: {
    cooldownMinutes: 15,
    hungerCostRange: [4, 8],
    affectionCostRange: [2, 4],
    xpRange: [18, 28],
  },
  bathe: {
    cooldownMinutes: 20,
    hpRange: [6, 10],
    affectionRange: [2, 4],
    xpRange: [6, 10],
  },
};

const DECAY_RULES = {
  hungerLossRange: [2, 4],
  affectionLossRange: [1, 2],
  socialLossRange: [1, 3],
  hpDrainRange: [5, 8],
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

function applyStatRange(profile, statKey, range, rng, updates, updateKey) {
  if (!range) {
    return;
  }

  const granted = rng(range[0], range[1]);
  const before = profile[statKey] || 0;
  const nextValue = clamp(before + granted);
  profile[statKey] = nextValue;
  updates[updateKey] = nextValue - before;
}

function applyStatCost(profile, statKey, range, rng, updates, updateKey) {
  if (!range) {
    return;
  }

  const consumed = rng(range[0], range[1]);
  const before = profile[statKey] || 0;
  const nextValue = clamp(before - consumed);
  profile[statKey] = nextValue;
  updates[updateKey] = nextValue - before;
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
    socialGranted: 0,
    hpGranted: 0,
    xpGranted: 0,
    leveledUp: false,
    newLevel: profile.level,
  };

  applyStatRange(profile, "hunger", actionConfig.hungerRange, rng, updates, "hungerGranted");
  applyStatRange(
    profile,
    "affection",
    actionConfig.affectionRange,
    rng,
    updates,
    "affectionGranted"
  );
  applyStatRange(profile, "social", actionConfig.socialRange, rng, updates, "socialGranted");
  applyStatRange(profile, "hp", actionConfig.hpRange, rng, updates, "hpGranted");

  applyStatCost(
    profile,
    "hunger",
    actionConfig.hungerCostRange,
    rng,
    updates,
    "hungerGranted"
  );
  applyStatCost(
    profile,
    "affection",
    actionConfig.affectionCostRange,
    rng,
    updates,
    "affectionGranted"
  );

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
    social: profile.social,
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
  const lastCuddle = profile.lastCare?.cuddle
    ? new Date(profile.lastCare.cuddle).getTime()
    : 0;
  const lastSocialPlay = profile.lastCare?.socialPlay
    ? new Date(profile.lastCare.socialPlay).getTime()
    : 0;

  if (lastFeed && nowMs - lastFeed > thresholdMs) {
    profile.hunger = clamp(
      profile.hunger - rng(DECAY_RULES.hungerLossRange[0], DECAY_RULES.hungerLossRange[1])
    );
  }

  const affectionAnchor = Math.max(lastPet, lastPlay, lastCuddle);
  if (affectionAnchor && nowMs - affectionAnchor > thresholdMs) {
    profile.affection = clamp(
      profile.affection -
        rng(DECAY_RULES.affectionLossRange[0], DECAY_RULES.affectionLossRange[1])
    );
  }

  const socialAnchor = Math.max(lastPlay, lastSocialPlay, lastCuddle);
  if (socialAnchor && nowMs - socialAnchor > thresholdMs) {
    profile.social = clamp(
      profile.social - rng(DECAY_RULES.socialLossRange[0], DECAY_RULES.socialLossRange[1])
    );
  }

  if (
    profile.hunger === STATS_MIN ||
    profile.affection === STATS_MIN ||
    profile.social === STATS_MIN
  ) {
    profile.hp = clamp(
      profile.hp - rng(DECAY_RULES.hpDrainRange[0], DECAY_RULES.hpDrainRange[1])
    );
  }

  if (
    profile.hunger === STATS_MAX &&
    profile.affection === STATS_MAX &&
    profile.social === STATS_MAX
  ) {
    profile.hp = clamp(profile.hp + rng(DECAY_RULES.hpGainRange[0], DECAY_RULES.hpGainRange[1]));
  }

  const events = {
    hungerDroppedBelowThreshold:
      previous.hunger >= notificationThreshold && profile.hunger < notificationThreshold,
    affectionDroppedBelowThreshold:
      previous.affection >= notificationThreshold &&
      profile.affection < notificationThreshold,
    socialDroppedBelowThreshold:
      previous.social >= notificationThreshold && profile.social < notificationThreshold,
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
