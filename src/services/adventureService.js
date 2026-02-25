const env = require("../config/env");
const playerRepository = require("../repositories/playerRepository");
const playerAdventureRepository = require("../repositories/playerAdventureRepository");
const playerParkRepository = require("../repositories/playerParkRepository");
const economyService = require("./economyService");
const progressionService = require("./progressionService");
const seasonService = require("./seasonService");
const globalEventService = require("./globalEventService");
const battlePowerService = require("./battlePowerService");
const { evaluateMood } = require("../domain/mood/evaluateMood");
const { applyLevelProgression } = require("../domain/progression/calculateXpForLevel");

const DURATION_OPTIONS_MINUTES = [30, 60, 120, 240, 480];

const ROUTES = [
  {
    id: "meadow_patrol",
    label: "Meadow Patrol",
    recommendedBattlePower: 0,
    risk: 0.85,
    rewardMultiplier: 1,
    damageRange: [4, 11],
    baseCoins: 35,
    baseXp: 22,
    mediaKey: "adventure/meadow_patrol",
    dropTable: {
      food_pack: 0.25,
      toy_box: 0.15,
      mood_cookie: 0.08,
    },
  },
  {
    id: "crystal_cavern",
    label: "Crystal Cavern",
    recommendedBattlePower: 90,
    risk: 1.2,
    rewardMultiplier: 1.18,
    damageRange: [7, 16],
    baseCoins: 54,
    baseXp: 34,
    mediaKey: "adventure/crystal_caverns",
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
    recommendedBattlePower: 180,
    risk: 1.55,
    rewardMultiplier: 1.38,
    damageRange: [9, 21],
    baseCoins: 74,
    baseXp: 50,
    mediaKey: "adventure/starfall_ruins",
    dropTable: {
      nebula_kite: 0.09,
      deluxe_health_kit: 0.12,
      star_snack: 0.14,
      guardian_band: 0.03,
    },
  },
  {
    id: "obsidian_citadel",
    label: "Obsidian Citadel",
    recommendedBattlePower: 300,
    risk: 1.9,
    rewardMultiplier: 1.62,
    damageRange: [11, 26],
    baseCoins: 95,
    baseXp: 64,
    mediaKey: "adventure/obsidian_citadel",
    dropTable: {
      guardian_band: 0.08,
      deluxe_health_kit: 0.2,
      star_snack: 0.2,
      travel_charm: 0.16,
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

function getConditionScore(player, mood) {
  const hpPart = (player.hp || 0) / 100;
  const hungerPart = (player.hunger || 0) / 100;
  const affectionPart = (player.affection || 0) / 100;

  let score = hpPart * 0.4 + hungerPart * 0.3 + affectionPart * 0.3;

  if (mood === "Joyful") {
    score += 0.07;
  } else if (mood === "Calm") {
    score += 0.04;
  } else if (mood === "Sleepy") {
    score -= 0.03;
  } else if (mood === "Hungry") {
    score -= 0.1;
  } else if (mood === "Lonely") {
    score -= 0.08;
  } else if (mood === "Worn Out") {
    score -= 0.14;
  } else if (mood === "Exhausted") {
    score -= 0.2;
  }

  return clamp(score, 0.05, 0.95);
}

function getBattlePowerScore(player, route) {
  const battlePower = clamp(player.battlePower || 0, 0, 1000);
  if (route.recommendedBattlePower <= 0) {
    return clamp((battlePower + 30) / 120, 0.2, 1);
  }

  return clamp(battlePower / route.recommendedBattlePower, 0.03, 1);
}

function getReadinessScore(player, route, mood) {
  const bpWeight = env.adventureBpWeightPercent / 100;
  const conditionWeight = env.adventureConditionWeightPercent / 100;
  const bpScore = getBattlePowerScore(player, route);
  const conditionScore = getConditionScore(player, mood);

  return clamp(bpScore * bpWeight + conditionScore * conditionWeight, 0.03, 0.98);
}

function getRiskBand(score) {
  if (score >= 0.72) {
    return "Low";
  }
  if (score >= 0.48) {
    return "Medium";
  }
  return "High";
}

function estimateSuccessChance({
  playerHp,
  hpFloor,
  route,
  riskScore,
  durationMinutes,
  seed,
  trials = 64,
}) {
  const checkpointMinutes = 15;
  const segments = Math.max(1, Math.ceil(durationMinutes / checkpointMinutes));
  let success = 0;

  for (let trial = 0; trial < trials; trial += 1) {
    const rng = createRng((seed + trial * 7919) >>> 0);
    let hpTrack = playerHp;
    let failed = false;

    for (let index = 0; index < segments; index += 1) {
      const rolled = rng.between(route.damageRange[0], route.damageRange[1]);
      const segmentDamage = Math.max(1, Math.round(rolled * riskScore));
      hpTrack -= segmentDamage;
      if (hpTrack < hpFloor) {
        failed = true;
        break;
      }
    }

    if (!failed) {
      success += 1;
    }
  }

  return clamp(success / trials, 0.01, 0.99);
}

function getDangerLevel(readiness, successChance) {
  const safety = clamp(successChance * 0.8 + readiness * 0.2, 0, 1);

  if (safety >= 0.9) {
    return "Peaceful";
  }
  if (safety >= 0.74) {
    return "Low";
  }
  if (safety >= 0.52) {
    return "Medium";
  }
  if (safety >= 0.32) {
    return "High";
  }

  return "Hellscape";
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

function getEtaWindowMinutes(baselineMinutes, rng) {
  const variance = env.adventureEtaVariancePercent / 100;
  const earliest = Math.max(5, Math.round(baselineMinutes * (1 - variance)));
  const latest = Math.max(earliest, Math.round(baselineMinutes * (1 + variance)));
  const resolved = rng.between(earliest, latest);
  return {
    earliest,
    latest,
    resolved,
  };
}

function calculateAdventureBlueprint(
  player,
  route,
  baselineDurationMinutes,
  supportModifiers,
  now = new Date()
) {
  const mood = evaluateMood(player, { sleeping: false });
  const readiness = getReadinessScore(player, route, mood);
  const mitigation = clamp(supportModifiers?.mitigation || 0, 0, 0.5);
  const rewardBoost = clamp(supportModifiers?.rewardBoost || 0, 0, 0.5);
  const riskScore = clamp(
    route.risk * (1.35 - readiness) * (1 - mitigation * 0.85),
    0.45,
    3.2
  );

  const seed = hashString(
    `${player.userId}:${route.id}:${baselineDurationMinutes}:${now.toISOString().slice(0, 16)}`
  );
  const rng = createRng(seed);

  const etaWindow = getEtaWindowMinutes(baselineDurationMinutes, rng);
  const earliestResolveAt = new Date(now.getTime() + etaWindow.earliest * 60 * 1000);
  const latestResolveAt = new Date(now.getTime() + etaWindow.latest * 60 * 1000);
  const hpFloor = env.adventureFailThresholdHp;
  const estimatedSuccessChance = estimateSuccessChance({
    playerHp: player.hp || 1,
    hpFloor,
    route,
    riskScore,
    durationMinutes: etaWindow.resolved,
    seed,
  });
  const dangerLevel = getDangerLevel(readiness, estimatedSuccessChance);

  const checkpoints = [];
  const checkpointMinutes = 15;
  const segments = Math.max(1, Math.ceil(etaWindow.resolved / checkpointMinutes));
  let hpTrack = player.hp;
  let totalDamage = 0;
  let failureAt = null;
  let failedMinuteMark = etaWindow.resolved;

  for (let index = 1; index <= segments; index += 1) {
    const minuteMark = Math.min(etaWindow.resolved, index * checkpointMinutes);
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
      failedMinuteMark = minuteMark;
      break;
    }
  }

  totalDamage = Math.min(totalDamage, Math.max(0, player.hp - 1));

  const bpRatio =
    route.recommendedBattlePower <= 0
      ? (player.battlePower || 0) / 90
      : (player.battlePower || 0) / route.recommendedBattlePower;
  const bpMultiplier = clamp(0.35 + bpRatio * 0.75, 0.2, 1.35);
  const durationScale = clamp(Math.pow(etaWindow.resolved / 60, 0.92), 0.55, 5.5);
  const rewardPotential = clamp(
    0.55 + readiness * 0.42 + bpMultiplier * 0.35 + rng.next() * 0.1 + rewardBoost,
    0.35,
    1.55
  );
  const baseCoins = Math.round(
    route.baseCoins * (route.rewardMultiplier || 1) * durationScale * rewardPotential
  );
  const baseXp = Math.round(
    route.baseXp * (route.rewardMultiplier || 1) * durationScale * rewardPotential
  );
  const successItems = rollItemDrops(
    route.dropTable,
    rng,
    clamp(0.55 + rewardPotential * 0.35, 0.3, 1.6)
  );
  const failed = Boolean(failureAt);
  const resolvedAt = failed
    ? failureAt
    : new Date(now.getTime() + etaWindow.resolved * 60 * 1000);

  const failureRewardScale = 0.03;
  const rewardCoins = failed ? Math.round(baseCoins * failureRewardScale) : baseCoins;
  const rewardXp = failed ? Math.round(baseXp * failureRewardScale) : baseXp;
  const rewardItems = failed ? {} : successItems;

  return {
    mood,
    readiness,
    riskBand: getRiskBand(readiness),
    estimatedSuccessChance,
    dangerLevel,
    seed: rng.seed(),
    checkpoints,
    totalDamage,
    failureAt,
    resolvedAt,
    resolvedDurationMinutes: failed ? failedMinuteMark : etaWindow.resolved,
    earliestResolveAt,
    latestResolveAt,
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

  const route = getRoute(run.routeId);
  const ready = isAdventureReady(run, now);
  const msRemaining = ready ? 0 : new Date(run.resolvedAt).getTime() - now.getTime();
  return {
    routeId: run.routeId,
    routeLabel: run.routeLabel,
    routeMediaKey: route?.mediaKey || "",
    recommendedBattlePower: route?.recommendedBattlePower ?? 0,
    baselineDurationMinutes: run.baselineDurationMinutes || run.durationMinutes,
    durationMinutes: run.durationMinutes,
    startedAt: run.startedAt,
    endsAt: run.endsAt,
    earliestResolveAt: run.earliestResolveAt || run.endsAt,
    latestResolveAt: run.latestResolveAt || run.endsAt,
    resolvedAt: run.resolvedAt,
    status: ready ? (run.failureAt ? "failed" : "completed") : "active",
    riskBand: run.riskBand,
    preparednessScore: run.preparednessScore,
    successChanceEstimate: run.successChanceEstimate,
    dangerLevel: run.dangerLevel || "Medium",
    supportItemId: run.supportItemId,
    supportItemLabel: run.supportItemLabel,
    failThresholdHp: run.failThresholdHp,
    checkpoints: run.checkpoints,
    totalDamage: run.totalDamage,
    rewardCoins: run.rewardCoins,
    rewardXp: run.rewardXp,
    rewardItems: toPlainRewards(run.rewardItems),
    completionNotifiedAt: run.completionNotifiedAt || null,
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

  const [player, parkRecord] = await Promise.all([
    playerRepository.findByUserId(userId),
    playerParkRepository.findByUserId(userId),
  ]);
  if (!player) {
    return {
      ok: false,
      reason: "missing-player",
    };
  }

  if (parkRecord?.activeSession) {
    const pendingLeave = now.getTime() >= new Date(parkRecord.activeSession.resolvedAt).getTime();
    return {
      ok: false,
      reason: pendingLeave ? "park-leave-required" : "park-active",
    };
  }

  const bpDecay = battlePowerService.applyLazyDecay(player, now, { touch: true });

  const record = await ensureAdventureRecord(userId);
  if (record.activeRun && !record.activeRun.claimedAt) {
    const ready = isAdventureReady(record.activeRun, now);
    return {
      ok: false,
      reason: ready ? "claim-required" : "already-active",
      run: serializeRun(record.activeRun, now),
    };
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
    baselineDurationMinutes: safeDuration,
    durationMinutes: blueprint.resolvedDurationMinutes,
    startedAt: now,
    endsAt: new Date(now.getTime() + safeDuration * 60 * 1000),
    earliestResolveAt: blueprint.earliestResolveAt,
    latestResolveAt: blueprint.latestResolveAt,
    resolvedAt: blueprint.resolvedAt,
    status: "active",
    seed: blueprint.seed,
    preparednessScore: blueprint.readiness,
    riskBand: blueprint.riskBand,
    successChanceEstimate: blueprint.estimatedSuccessChance,
    dangerLevel: blueprint.dangerLevel,
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
    completionNotifiedAt: null,
    claimedAt: null,
  };

  record.activeRun = run;
  await Promise.all([
    playerAdventureRepository.saveAdventure(record),
    playerRepository.savePlayer(player),
    progressionService.touchActivity(userId, now),
  ]);

  return {
    ok: true,
    run: serializeRun(run, now),
    mood: blueprint.mood,
    bpDecayApplied: bpDecay.decayed,
    preparationTips: [
      "Battle Power is the largest factor in route success.",
      "High HP, hunger, affection, and mood still reduce risk.",
      "Low BP can still start routes, but failure risk climbs sharply.",
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

async function listAdventureLocations(now = new Date()) {
  const counts = await playerAdventureRepository.countActiveByRoute(now);
  const countMap = new Map(counts.map((entry) => [entry.routeId, entry.count]));
  return ROUTES.map((route) => ({
    routeId: route.id,
    routeLabel: route.label,
    routeMediaKey: route.mediaKey,
    recommendedBattlePower: route.recommendedBattlePower,
    activeCount: countMap.get(route.id) || 0,
    durationOptionsMinutes: DURATION_OPTIONS_MINUTES,
  }));
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
    player.hunger = clampStat((player.hunger || 0) - 24);
    player.affection = clampStat((player.affection || 0) - 20);
    player.social = clampStat((player.social || 0) - 18);
  } else {
    player.hunger = clampStat((player.hunger || 0) - 12);
    player.affection = clampStat((player.affection || 0) - 9);
    player.social = clampStat((player.social || 0) - 8);
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
    progressionService.touchActivity(userId, now),
  ]);

  return {
    ok: true,
    status: failed ? "failed" : "completed",
    routeId: run.routeId,
    routeLabel: run.routeLabel,
    routeMediaKey: getRoute(run.routeId)?.mediaKey || "",
    rewardCoins: run.rewardCoins,
    rewardXp: run.rewardXp,
    rewardItems: toPlainRewards(run.rewardItems),
    damageTaken: run.totalDamage,
    player,
  };
}

async function pullReadyCompletionNotifications(now = new Date()) {
  const readyRuns = await playerAdventureRepository.listRunsReadyForNotification(now);
  const notifications = [];

  for (const record of readyRuns) {
    if (!record.activeRun) {
      continue;
    }

    record.activeRun.completionNotifiedAt = now;
    await playerAdventureRepository.saveAdventure(record);
    notifications.push({
      userId: record.userId,
      routeLabel: record.activeRun.routeLabel,
      status: record.activeRun.failureAt ? "failed" : "completed",
      routeId: record.activeRun.routeId,
    });
  }

  return notifications;
}

module.exports = {
  DURATION_OPTIONS_MINUTES,
  ROUTES,
  claimAdventure,
  getAdventureStatus,
  listAdventureLocations,
  pullReadyCompletionNotifications,
  startAdventure,
};
