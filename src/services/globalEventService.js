const env = require("../config/env");
const { GLOBAL_EVENTS } = require("../domain/events/globalEvents");
const globalEventRepository = require("../repositories/globalEventRepository");
const playerRepository = require("../repositories/playerRepository");
const playerProgressRepository = require("../repositories/playerProgressRepository");
const economyService = require("./economyService");
const progressionService = require("./progressionService");
const seasonService = require("./seasonService");
const { applyLevelProgression } = require("../domain/progression/calculateXpForLevel");

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pickEventDefinition(now = new Date()) {
  const dayIndex = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  return GLOBAL_EVENTS[dayIndex % GLOBAL_EVENTS.length];
}

function buildEventId(definition, now = new Date()) {
  return `${definition.key}:${now.toISOString()}:${Math.floor(Math.random() * 1000)}`;
}

function getContribution(event, userId) {
  if (!event || !event.contributions) {
    return 0;
  }
  if (typeof event.contributions.get === "function") {
    return Number(event.contributions.get(userId)) || 0;
  }
  return Number(event.contributions[userId]) || 0;
}

function getClaimed(event, userId) {
  if (!event || !event.claims) {
    return false;
  }
  if (typeof event.claims.get === "function") {
    return Boolean(event.claims.get(userId));
  }
  return Boolean(event.claims[userId]);
}

function findDefinitionByKey(key) {
  return GLOBAL_EVENTS.find((event) => event.key === key) || null;
}

async function getScaledGoal(definition, now = new Date()) {
  const windowHours = env.globalEventActivePlayerWindowHours;
  const since = new Date(now.getTime() - windowHours * 60 * 60 * 1000);
  const activePlayers = await playerProgressRepository.countActiveSince(since);
  const rawGoal = Math.ceil(
    activePlayers * env.globalEventTargetPerActive * definition.goalMultiplier
  );
  const goal = clamp(rawGoal, env.globalEventGoalMin, env.globalEventGoalMax);

  return {
    goal,
    activePlayers,
    windowHours,
    targetPerActive: env.globalEventTargetPerActive,
    minGoal: env.globalEventGoalMin,
    maxGoal: env.globalEventGoalMax,
    goalMultiplier: definition.goalMultiplier,
  };
}

async function createEventFromDefinition(
  definition,
  now = new Date(),
  options = {}
) {
  const startedAt = now;
  const endsAt = new Date(
    startedAt.getTime() + env.globalEventDurationHours * 60 * 60 * 1000
  );
  const scaling = await getScaledGoal(definition, startedAt);

  return globalEventRepository.createEvent({
    eventId: buildEventId(definition, startedAt),
    key: definition.key,
    title: definition.title,
    description: definition.description,
    startedAt,
    endsAt,
    goal: scaling.goal,
    progress: 0,
    completedAt: null,
    announcedCompletion: false,
    contributions: {},
    claims: {},
    scalingSnapshot: {
      activePlayers: scaling.activePlayers,
      goalMultiplier: scaling.goalMultiplier,
      targetPerActive: scaling.targetPerActive,
      minGoal: scaling.minGoal,
      maxGoal: scaling.maxGoal,
      windowHours: scaling.windowHours,
      computedAt: startedAt,
    },
    manualTrigger: {
      startedByUserId: options.startedByUserId || "",
      startedAt: options.startedByUserId ? startedAt : null,
    },
  });
}

async function ensureActiveGlobalEvent(now = new Date()) {
  const active = await globalEventRepository.findActive(now);
  if (active) {
    return active;
  }

  const definition = pickEventDefinition(now);
  return createEventFromDefinition(definition, now);
}

async function startGlobalEventManually(eventKey, startedByUserId, now = new Date()) {
  const active = await globalEventRepository.findActive(now);
  if (active) {
    return {
      ok: false,
      reason: "already-active",
      event: active,
    };
  }

  const definition = findDefinitionByKey(eventKey);
  if (!definition) {
    return {
      ok: false,
      reason: "unknown-event",
    };
  }

  const event = await createEventFromDefinition(definition, now, {
    startedByUserId,
  });

  return {
    ok: true,
    event,
  };
}

async function getGlobalEventStatus(userId, now = new Date()) {
  const event = await ensureActiveGlobalEvent(now);
  const contribution = userId ? getContribution(event, userId) : 0;
  const claimed = userId ? getClaimed(event, userId) : false;

  return {
    eventId: event.eventId,
    key: event.key,
    title: event.title,
    description: event.description,
    startedAt: event.startedAt,
    endsAt: event.endsAt,
    goal: event.goal,
    progress: event.progress,
    completed: Boolean(event.completedAt),
    completedAt: event.completedAt,
    contribution,
    claimed,
    scalingSnapshot: event.scalingSnapshot,
  };
}

async function recordContribution(userId, amount = 1, now = new Date()) {
  const safeAmount = Math.max(1, Number(amount) || 1);
  const event = await ensureActiveGlobalEvent(now);

  const current = getContribution(event, userId);
  event.contributions.set(userId, current + safeAmount);
  event.progress += safeAmount;

  if (!event.completedAt && event.progress >= event.goal) {
    event.completedAt = now;
  }

  await Promise.all([
    globalEventRepository.saveEvent(event),
    progressionService.recordWorldEventContribution(userId, safeAmount, now),
  ]);

  return {
    event,
    userContribution: current + safeAmount,
  };
}

async function claimGlobalEventReward(userId, now = new Date()) {
  const event = await ensureActiveGlobalEvent(now);
  const contribution = getContribution(event, userId);
  if (!event.completedAt) {
    return {
      ok: false,
      reason: "event-not-complete",
      event,
      contribution,
    };
  }

  if (contribution < 1) {
    return {
      ok: false,
      reason: "no-contribution",
      event,
      contribution,
    };
  }

  if (getClaimed(event, userId)) {
    return {
      ok: false,
      reason: "already-claimed",
      event,
      contribution,
    };
  }

  const definition = findDefinitionByKey(event.key) || pickEventDefinition(now);
  const rewardCoins = definition.rewardCoins + Math.min(40, contribution);
  const rewardXp = definition.rewardXp + Math.min(25, Math.floor(contribution / 2));

  const [economy, player] = await Promise.all([
    economyService.ensureEconomy(userId),
    playerRepository.findByUserId(userId),
  ]);

  economy.starCoins += rewardCoins;
  event.claims.set(userId, true);

  if (player) {
    player.xp += rewardXp;
    await seasonService.recordEntityProgress(
      "player",
      userId,
      player.kirbyName,
      rewardXp,
      now
    );

    const progression = applyLevelProgression(player.level, player.xp);
    player.level = progression.level;
    player.xp = progression.xp;
    await playerRepository.savePlayer(player);
  }

  await Promise.all([globalEventRepository.saveEvent(event), economy.save()]);

  return {
    ok: true,
    rewardCoins,
    rewardXp: player ? rewardXp : 0,
    contribution,
    event,
  };
}

async function getCompletedUnannouncedEvent(now = new Date()) {
  const event = await ensureActiveGlobalEvent(now);
  if (!event.completedAt || event.announcedCompletion) {
    return null;
  }
  return event;
}

async function markEventCompletionAnnounced(eventId) {
  const event = await globalEventRepository.findByEventId(eventId);
  if (!event) {
    return null;
  }
  event.announcedCompletion = true;
  await globalEventRepository.saveEvent(event);
  return event;
}

module.exports = {
  GLOBAL_EVENTS,
  claimGlobalEventReward,
  ensureActiveGlobalEvent,
  getCompletedUnannouncedEvent,
  getGlobalEventStatus,
  markEventCompletionAnnounced,
  recordContribution,
  startGlobalEventManually,
};
