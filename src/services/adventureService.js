const env = require("../config/env");
const playerRepository = require("../repositories/playerRepository");
const playerAdventureRepository = require("../repositories/playerAdventureRepository");
const economyService = require("./economyService");
const progressionService = require("./progressionService");
const seasonService = require("./seasonService");
const globalEventService = require("./globalEventService");
const { evaluateMood } = require("../domain/mood/evaluateMood");
const { applyLevelProgression } = require("../domain/progression/calculateXpForLevel");

const DURATION_OPTIONS_MINUTES = [30, 60, 120, 240, 480];

const ROUTES = [
  {
    id: "meadow_patrol",
    label: "Meadow Patrol",
    risk: 0.9,
    damageRange: [4, 10],
    baseCoins: 35,
    baseXp: 22,
    dropTable: {
      food_pack: 0.25,
      toy_box: 0.15,
      mood_cookie: 0.08,
    },
  },
  {
    id: "crystal_cavern",
    label: "Crystal Cavern",
    risk: 1.15,
    damageRange: [6, 14],
    baseCoins: 52,
    baseXp: 34,
    dropTable: {
      gourmet_meal: 0.18,
      sparkle_ball: 0.12,
      health_kit: 0.18,
      travel_charm: 0.06,
    },
  },
  {
    id: "starfall_ruins",
    label: "Starfall Ruins",
    risk: 1.35,
    damageRange: [8, 18],
    baseCoins: 70,
    baseXp: 48,
    dropTable: {
      nebula_kite: 0.09,
      deluxe_health_kit: 0.12,
      star_snack: 0.14,
      guardian_band: 0.03,
    },
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampStat(value) {
  return clamp(value, 0, 100);
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

function nextRandom(seed) {
  const nextSeed = (seed * 1664525 + 1013904223) >>> 0;
  return {
    seed: nextSeed,
    value: nextSeed / 4294967296,
  };
}

function createRng(seed) {
  let current = seed >>> 0;
  return {
    next() {
      const generated = nextRandom(current);
      current = generated.seed;
      return generated.value;
    },
    between(min, max) {
      const low = Math.ceil(min);
      const high = Math.floor(max);
      return Math.floor(this.next() * (high - low + 1)) + low;
    },
    seed() {
      return current;
    },
  };
}

function getRoute(routeId) {
  return ROUTES.find((route) => route.id === routeId) || null;
}

function getReadinessScore(player, mood) {
  const hpPart = (player.hp || 0) / 100;
  const hungerPart = (player.hunger || 0) / 100;
  const affectionPart = (player.affection || 0) / 100;
  const socialPart = (player.social || 0) / 100;

  let score =
    hpPart * 0.35 + hungerPart * 0.2 + affectionPart * 0.2 + socialPart * 0.25;

  if (mood === "Joyful") {
    score += 0.08;
  } else if (mood === "Calm") {
    score += 0.04;
  } else if (mood === "Sleepy") {
    score -= 0.03;
  } else if (mood === "Hungry") {
    score -= 0.1;
  } else if (mood === "Lonely") {
    score -= 0.1;
  } else if (mood === "Worn Out") {
    score -= 0.15;
  } else if (mood === "Exhausted") {
    score -= 0.2;
  }

  return clamp(score, 0.05, 0.95);
}

function getRiskBand(score) {
  if (score >= 0.68) {
    return "Low";
  }
  if (score >= 0.45) {
    return "Medium";
  }
  return "High";
}

function rollItemDrops(dropTable, rng, multiplier = 1) {
  const rewards = {};
  for (const [itemId, chance] of Object.entries(dropTable || {})) {
    if (rng.next() < chance * multiplier) {
      rewards[itemId] = (rewards[itemId] || 0) + 1;
    }
  }
  return rewards;
}

function isAdventureReady(run, now = new Date()) {
  if (!run) {
    return false;
  }

  return now.getTime() >= new Date(run.resolvedAt).getTime();
}

function toPlainRewards(rewardItems) {
  if (!rewardItems) {
    return {};
  }

  if (typeof rewardItems.entries === "function") {
    return Object.fromEntries(rewardItems.entries());
  }

  if (typeof rewardItems.toJSON === "function") {
    return rewardItems.toJSON();
  }

  return { ...rewardItems };
}

function calculateAdventureBlueprint(
  player,
  route,
  durationMinutes,
  supportModifiers,
  now = new Date()
) {
  const mood = evaluateMood(player, { sleeping: false });
  const readiness = getReadinessScore(player, mood);
  const mitigation = clamp(supportModifiers?.mitigation || 0, 0, 0.5);
  const rewardBoost = clamp(supportModifiers?.rewardBoost || 0, 0, 0.5);
  const riskScore = clamp(route.risk * (1.15 - readiness) * (1 - mitigation), 0.35, 2.2);

  const seed = hashString(
    `${player.userId}:${route.id}:${durationMinutes}:${now.toISOString().slice(0, 16)}`
  );
  const rng = createRng(seed);
  const checkpoints = [];
  const segments = Math.max(1, Math.ceil(durationMinutes / 30));
  const hpFloor = env.adventureFailThresholdHp;
  let hpTrack = player.hp;
  let totalDamage = 0;
  let failureAt = null;

  for (let index = 1; index <= segments; index += 1) {
    const minuteMark = Math.min(durationMinutes, index * 30);
    const rolled = rng.between(route.damageRange[0], route.damageRange[1]);
    const segmentDamage = Math.max(1, Math.round(rolled * riskScore));
    totalDamage += segmentDamage;
    hpTrack -= segmentDamage;
    checkpoints.push({
      minuteMark,
      damage: segmentDamage,
    });

    if (!failureAt && hpTrack < hpFloor) {
      failureAt = new Date(now.getTime() + minuteMark * 60 * 1000);
      break;
    }
  }

  totalDamage = Math.min(totalDamage, Math.max(0, player.hp - 1));

  const durationScale = durationMinutes / 60;
  const outcomeMultiplier = Math.max(0.45, readiness + rewardBoost + rng.next() * 0.25);
  const baseCoins = Math.round(route.baseCoins * durationScale * outcomeMultiplier);
  const baseXp = Math.round(route.baseXp * durationScale * outcomeMultiplier);
  const successItems = rollItemDrops(route.dropTable, rng, 1 + rewardBoost);
  const failed = Boolean(failureAt);
  const resolvedAt = failed
    ? failureAt
    : new Date(now.getTime() + durationMinutes * 60 * 1000);

  const failureRewardScale = 0.08;
  const rewardCoins = failed ? Math.round(baseCoins * failureRewardScale) : baseCoins;
  const rewardXp = failed ? Math.round(baseXp * failureRewardScale) : baseXp;
  const rewardItems = failed ? {} : successItems;

  return {
    mood,
    readiness,
    riskBand: getRiskBand(readiness),
    seed: rng.seed(),
    checkpoints,
    totalDamage,
    failureAt,
    resolvedAt,
    rewardCoins,
    rewardXp,
    rewardItems,
    failed,
  };
}

async function ensureAdventureRecord(userId) {
  return playerAdventureRepository.upsertByUserId(userId, {});
}

function serializeRun(run, now = new Date()) {
  if (!run) {
    return null;
  }

  const ready = isAdventureReady(run, now);
  const msRemaining = ready ? 0 : new Date(run.resolvedAt).getTime() - now.getTime();
  return {
    routeId: run.routeId,
    routeLabel: run.routeLabel,
    durationMinutes: run.durationMinutes,
    startedAt: run.startedAt,
    endsAt: run.endsAt,
    resolvedAt: run.resolvedAt,
    status: ready ? (run.failureAt ? "failed" : "completed") : "active",
    riskBand: run.riskBand,
    preparednessScore: run.preparednessScore,
    supportItemId: run.supportItemId,
    supportItemLabel: run.supportItemLabel,
    failThresholdHp: run.failThresholdHp,
    checkpoints: run.checkpoints,
    totalDamage: run.totalDamage,
    rewardCoins: run.rewardCoins,
    rewardXp: run.rewardXp,
    rewardItems: toPlainRewards(run.rewardItems),
    msRemaining,
  };
}

async function startAdventure(
  userId,
  { routeId, durationMinutes, supportItemId = "" },
  now = new Date()
) {
  const route = getRoute(routeId);
  if (!route) {
    return {
      ok: false,
      reason: "unknown-route",
    };
  }

  const safeDuration = Number(durationMinutes);
  if (!DURATION_OPTIONS_MINUTES.includes(safeDuration)) {
    return {
      ok: false,
      reason: "invalid-duration",
      allowedDurations: DURATION_OPTIONS_MINUTES,
    };
  }

  const player = await playerRepository.findByUserId(userId);
  if (!player) {
    return {
      ok: false,
      reason: "missing-player",
    };
  }

  if ((player.hp || 0) < env.adventureMinStartHp) {
    return {
      ok: false,
      reason: "low-hp",
      minHp: env.adventureMinStartHp,
      currentHp: player.hp,
    };
  }

  const record = await ensureAdventureRecord(userId);
  if (record.activeRun && !record.activeRun.claimedAt) {
    const ready = isAdventureReady(record.activeRun, now);
    if (!ready) {
      return {
        ok: false,
        reason: "already-active",
        run: serializeRun(record.activeRun, now),
      };
    }
  }

  const support = await economyService.consumeAdventureSupportItem(userId, supportItemId);
  if (!support.ok) {
    return {
      ok: false,
      reason: support.reason,
      item: support.item,
    };
  }

  const blueprint = calculateAdventureBlueprint(
    player,
    route,
    safeDuration,
    support,
    now
  );
  const run = {
    routeId: route.id,
    routeLabel: route.label,
    durationMinutes: safeDuration,
    startedAt: now,
    endsAt: new Date(now.getTime() + safeDuration * 60 * 1000),
    resolvedAt: blueprint.resolvedAt,
    status: "active",
    seed: blueprint.seed,
    preparednessScore: blueprint.readiness,
    riskBand: blueprint.riskBand,
    supportItemId: support.item?.id || "",
    supportItemLabel: support.item?.label || "",
    hpAtStart: player.hp,
    failThresholdHp: env.adventureFailThresholdHp,
    failureAt: blueprint.failureAt,
    checkpoints: blueprint.checkpoints,
    totalDamage: blueprint.totalDamage,
    rewardCoins: blueprint.rewardCoins,
    rewardXp: blueprint.rewardXp,
    rewardItems: blueprint.rewardItems,
    claimedAt: null,
  };

  record.activeRun = run;
  await playerAdventureRepository.saveAdventure(record);

  return {
    ok: true,
    run: serializeRun(run, now),
    mood: blueprint.mood,
    preparationTips: [
      "Higher HP, hunger, affection, and social reduce failure risk.",
      "Support items reduce incoming adventure damage.",
      "If HP drops too low, the adventure ends early.",
    ],
  };
}

async function getAdventureStatus(userId, now = new Date()) {
  const record = await ensureAdventureRecord(userId);
  const run = serializeRun(record.activeRun, now);
  return {
    run,
    history: record.history || [],
  };
}

async function claimAdventure(userId, now = new Date()) {
  const [record, player] = await Promise.all([
    ensureAdventureRecord(userId),
    playerRepository.findByUserId(userId),
  ]);

  if (!record.activeRun) {
    return {
      ok: false,
      reason: "missing-run",
    };
  }

  if (!player) {
    return {
      ok: false,
      reason: "missing-player",
    };
  }

  const run = record.activeRun;
  if (!isAdventureReady(run, now)) {
    return {
      ok: false,
      reason: "not-ready",
      run: serializeRun(run, now),
    };
  }

  if (run.claimedAt) {
    return {
      ok: false,
      reason: "already-claimed",
    };
  }

  const failed = Boolean(run.failureAt);
  const damageTaken = Math.max(0, Number(run.totalDamage) || 0);
  player.hp = clampStat(Math.max(1, (player.hp || 0) - damageTaken));

  if (failed) {
    player.hunger = clampStat((player.hunger || 0) - 20);
    player.affection = clampStat((player.affection || 0) - 18);
    player.social = clampStat((player.social || 0) - 22);
  } else {
    player.hunger = clampStat((player.hunger || 0) - 10);
    player.affection = clampStat((player.affection || 0) - 8);
    player.social = clampStat((player.social || 0) - 10);
  }

  const economy = await economyService.ensureEconomy(userId);
  economy.starCoins += run.rewardCoins;

  player.xp += run.rewardXp;
  const progression = applyLevelProgression(player.level, player.xp);
  player.level = progression.level;
  player.xp = progression.xp;

  if (!failed) {
    await progressionService.recordAdventureCompletion(userId, now);
    await globalEventService.recordContribution(userId, 3, now);
  } else {
    await globalEventService.recordContribution(userId, 1, now);
  }

  if (run.rewardXp > 0) {
    await seasonService.recordEntityProgress(
      "player",
      userId,
      player.kirbyName,
      run.rewardXp,
      now
    );
  }

  if (run.rewardItems && Object.keys(run.rewardItems).length) {
    await economyService.addItemsToInventory(userId, run.rewardItems);
  }

  run.claimedAt = now;
  record.history = record.history || [];
  record.history.unshift({
    routeId: run.routeId,
    routeLabel: run.routeLabel,
    status: failed ? "failed" : "completed",
    startedAt: run.startedAt,
    resolvedAt: run.resolvedAt,
    rewardCoins: run.rewardCoins,
    rewardXp: run.rewardXp,
    totalDamage: run.totalDamage,
  });
  record.history = record.history.slice(0, 20);
  record.activeRun = null;

  await Promise.all([
    playerRepository.savePlayer(player),
    playerAdventureRepository.saveAdventure(record),
    economy.save(),
  ]);

  return {
    ok: true,
    status: failed ? "failed" : "completed",
    rewardCoins: run.rewardCoins,
    rewardXp: run.rewardXp,
    rewardItems: toPlainRewards(run.rewardItems),
    damageTaken: run.totalDamage,
    player,
  };
}

module.exports = {
  DURATION_OPTIONS_MINUTES,
  ROUTES,
  claimAdventure,
  getAdventureStatus,
  startAdventure,
};
