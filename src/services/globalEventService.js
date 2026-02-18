const env = require("../config/env");
const { GLOBAL_EVENTS } = require("../domain/events/globalEvents");
const globalEventRepository = require("../repositories/globalEventRepository");
const globalEventCycleRepository = require("../repositories/globalEventCycleRepository");
const playerRepository = require("../repositories/playerRepository");
const playerProgressRepository = require("../repositories/playerProgressRepository");
const economyService = require("./economyService");
const progressionService = require("./progressionService");
const seasonService = require("./seasonService");
const { applyLevelProgression } = require("../domain/progression/calculateXpForLevel");

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomInt(min, max) {
  const safeMin = Math.ceil(min);
  const safeMax = Math.floor(max);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

function pickEventDefinition() {
  const index = Math.floor(Math.random() * GLOBAL_EVENTS.length);
  return GLOBAL_EVENTS[index];
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

function getDurationHoursForEvent(event) {
  if (!event?.startedAt || !event?.endsAt) {
    return 0;
  }
  return Math.max(
    1,
    Math.round(
      (new Date(event.endsAt).getTime() - new Date(event.startedAt).getTime()) /
        (60 * 60 * 1000)
    )
  );
}

async function ensureCycleState(now = new Date()) {
  const cycleState = await globalEventCycleRepository.getSingleton();
  if (!cycleState.nextEligibleAt) {
    cycleState.nextEligibleAt = now;
    await globalEventCycleRepository.saveCycleState(cycleState);
  }
  return cycleState;
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
  const durationHours =
    options.durationHours ||
    randomInt(env.globalEventDurationMinHours, env.globalEventDurationMaxHours);
  const endsAt = new Date(startedAt.getTime() + durationHours * 60 * 60 * 1000);
  const scaling = await getScaledGoal(definition, startedAt);

  const event = await globalEventRepository.createEvent({
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

  return {
    event,
    durationHours,
  };
}

async function getActiveGlobalEvent(now = new Date()) {
  return globalEventRepository.findActive(now);
}

async function getActiveUserIdsForStartNotifications(now = new Date()) {
  const since = new Date(
    now.getTime() - env.globalEventActivePlayerWindowHours * 60 * 60 * 1000
  );
  const activeRows = await playerProgressRepository.listActiveSince(since);
  return Array.from(
    new Set(activeRows.map((row) => row.userId).filter(Boolean))
  );
}

async function startEventFromDefinition(
  definition,
  now = new Date(),
  options = {}
) {
  const active = await getActiveGlobalEvent(now);
  if (active) {
    return {
      ok: false,
      reason: "already-active",
      event: active,
    };
  }

  const [cycleState, created] = await Promise.all([
    ensureCycleState(now),
    createEventFromDefinition(definition, now, {
      startedByUserId: options.startedByUserId || "",
    }),
  ]);
  const idleGapHours = randomInt(
    env.globalEventIdleGapMinHours,
    env.globalEventIdleGapMaxHours
  );
  const nextEligibleAt = new Date(
    new Date(created.event.endsAt).getTime() + idleGapHours * 60 * 60 * 1000
  );

  cycleState.lastStartedAt = now;
  cycleState.lastEndedAt = created.event.endsAt;
  cycleState.lastEventId = created.event.eventId;
  cycleState.lastDurationHours = created.durationHours;
  cycleState.lastIdleGapHours = idleGapHours;
  cycleState.nextEligibleAt = nextEligibleAt;
  await globalEventCycleRepository.saveCycleState(cycleState);

  const activeUserIds = await getActiveUserIdsForStartNotifications(now);

  return {
    ok: true,
    source: options.source || "scheduled",
    event: created.event,
    durationHours: created.durationHours,
    idleGapHours,
    nextEligibleAt,
    activeUserIds,
  };
}

async function maybeStartScheduledGlobalEvent(now = new Date()) {
  const active = await getActiveGlobalEvent(now);
  if (active) {
    return {
      started: false,
      reason: "active-event",
      event: active,
    };
  }

  const cycleState = await ensureCycleState(now);
  if (now.getTime() < new Date(cycleState.nextEligibleAt).getTime()) {
    return {
      started: false,
      reason: "not-eligible",
      nextEligibleAt: cycleState.nextEligibleAt,
    };
  }

  cycleState.lastRollAt = now;
  await globalEventCycleRepository.saveCycleState(cycleState);

  const chance = env.globalEventStartChancePerTickPercent / 100;
  if (Math.random() > chance) {
    return {
      started: false,
      reason: "chance-miss",
      nextEligibleAt: cycleState.nextEligibleAt,
      chance,
    };
  }

  const definition = pickEventDefinition(now);
  const startResult = await startEventFromDefinition(definition, now, {
    source: "scheduled",
  });

  if (!startResult.ok) {
    return {
      started: false,
      reason: startResult.reason || "start-failed",
      event: startResult.event,
    };
  }

  return {
    started: true,
    ...startResult,
  };
}

async function startGlobalEventManually(eventKey, startedByUserId, now = new Date()) {
  const definition = findDefinitionByKey(eventKey);
  if (!definition) {
    return {
      ok: false,
      reason: "unknown-event",
    };
  }

  return startEventFromDefinition(definition, now, {
    startedByUserId,
    source: "manual",
  });
}

async function getGlobalEventStatus(userId, now = new Date()) {
  const event = await getActiveGlobalEvent(now);
  if (!event) {
    const cycleState = await ensureCycleState(now);
    return {
      active: false,
      nextEligibleAt: cycleState.nextEligibleAt,
      startChancePerTickPercent: env.globalEventStartChancePerTickPercent,
      durationRangeHours: [
        env.globalEventDurationMinHours,
        env.globalEventDurationMaxHours,
      ],
      idleGapRangeHours: [
        env.globalEventIdleGapMinHours,
        env.globalEventIdleGapMaxHours,
      ],
    };
  }

  const contribution = userId ? getContribution(event, userId) : 0;
  const claimed = userId ? getClaimed(event, userId) : false;

  return {
    active: true,
    eventId: event.eventId,
    key: event.key,
    title: event.title,
    description: event.description,
    startedAt: event.startedAt,
    endsAt: event.endsAt,
    durationHours: getDurationHoursForEvent(event),
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
  const event = await getActiveGlobalEvent(now);
  if (!event) {
    return {
      ok: false,
      reason: "no-active-event",
    };
  }

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
    ok: true,
    event,
    userContribution: current + safeAmount,
  };
}

async function claimGlobalEventReward(userId, now = new Date()) {
  const event = await getActiveGlobalEvent(now);
  if (!event) {
    return {
      ok: false,
      reason: "no-active-event",
    };
  }

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

async function getCompletedUnannouncedEvent() {
  return globalEventRepository.findLatestCompletedUnannounced();
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
  getActiveGlobalEvent,
  getActiveUserIdsForStartNotifications,
  getCompletedUnannouncedEvent,
  getGlobalEventStatus,
  markEventCompletionAnnounced,
  maybeStartScheduledGlobalEvent,
  recordContribution,
  startGlobalEventManually,
};
