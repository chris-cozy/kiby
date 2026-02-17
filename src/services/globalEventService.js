const env = require("../config/env");
const { GLOBAL_EVENTS } = require("../domain/events/globalEvents");
const globalEventRepository = require("../repositories/globalEventRepository");
const playerRepository = require("../repositories/playerRepository");
const economyService = require("./economyService");
const progressionService = require("./progressionService");
const seasonService = require("./seasonService");
const { applyLevelProgression } = require("../domain/progression/calculateXpForLevel");

function pickEventDefinition(now = new Date()) {
  const dayIndex = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  return GLOBAL_EVENTS[dayIndex % GLOBAL_EVENTS.length];
}

function buildEventId(definition, now = new Date()) {
  return `${definition.key}:${now.toISOString().slice(0, 13)}`;
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

async function ensureActiveGlobalEvent(now = new Date()) {
  const active = await globalEventRepository.findActive(now);
  if (active) {
    return active;
  }

  const definition = pickEventDefinition(now);
  const startedAt = now;
  const endsAt = new Date(
    startedAt.getTime() + env.globalEventDurationHours * 60 * 60 * 1000
  );
  const goal = Math.max(10, Math.round(env.globalEventGoal * definition.goalMultiplier));

  return globalEventRepository.createEvent({
    eventId: buildEventId(definition, startedAt),
    key: definition.key,
    title: definition.title,
    description: definition.description,
    startedAt,
    endsAt,
    goal,
    progress: 0,
    completedAt: null,
    announcedCompletion: false,
    contributions: {},
    claims: {},
  });
}

function findDefinitionByKey(key) {
  return GLOBAL_EVENTS.find((event) => event.key === key) || GLOBAL_EVENTS[0];
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

  const definition = findDefinitionByKey(event.key);
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
    const seasonResult = await seasonService.recordEntityProgress(
      "player",
      userId,
      player.kirbyName,
      rewardXp,
      now
    );
    if (!seasonResult) {
      // no-op
    }

    const progression = applyLevelProgression(player.level, player.xp);
    player.level = progression.level;
    player.xp = progression.xp;
    await playerRepository.savePlayer(player);
  }

  await Promise.all([
    globalEventRepository.saveEvent(event),
    economy.save(),
  ]);

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
  claimGlobalEventReward,
  ensureActiveGlobalEvent,
  getCompletedUnannouncedEvent,
  getGlobalEventStatus,
  markEventCompletionAnnounced,
  recordContribution,
};
