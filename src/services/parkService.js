const playerRepository = require("../repositories/playerRepository");
const playerAdventureRepository = require("../repositories/playerAdventureRepository");
const playerParkRepository = require("../repositories/playerParkRepository");
const progressionService = require("./progressionService");
const globalEventService = require("./globalEventService");

const DURATION_OPTIONS_MINUTES = [30, 60, 120, 240, 480];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampStat(value) {
  return clamp(value, 0, 100);
}

function isSessionActive(session, now = new Date()) {
  if (!session) {
    return false;
  }

  return now.getTime() < new Date(session.resolvedAt).getTime();
}

function computePlannedEffects(durationMinutes) {
  const halfHourBlocks = Math.max(1, Math.round(durationMinutes / 30));
  const socialPerBlock = 12 + Math.floor(Math.random() * 8); // 12..19
  const hungerPerBlock = 8 + Math.floor(Math.random() * 6); // 8..13

  return {
    socialGain: Math.max(6, Math.round(halfHourBlocks * socialPerBlock)),
    hungerLoss: Math.max(4, Math.round(halfHourBlocks * hungerPerBlock)),
  };
}

function buildSessionResolution(session, now = new Date()) {
  const startedAtMs = new Date(session.startedAt).getTime();
  const resolvedAtMs = new Date(session.resolvedAt).getTime();
  const effectiveNowMs = clamp(now.getTime(), startedAtMs, resolvedAtMs);
  const durationMs = Math.max(1, resolvedAtMs - startedAtMs);
  const elapsedMs = Math.max(0, effectiveNowMs - startedAtMs);
  const elapsedRatio = clamp(elapsedMs / durationMs, 0, 1);

  const socialGain =
    elapsedRatio <= 0 ? 0 : Math.max(1, Math.round(session.plannedSocialGain * elapsedRatio));
  const hungerLoss =
    elapsedRatio <= 0 ? 0 : Math.max(1, Math.round(session.plannedHungerLoss * elapsedRatio));
  const completed = effectiveNowMs >= resolvedAtMs;

  return {
    completed,
    elapsedMinutes: Math.floor(elapsedMs / 60000),
    plannedDurationMinutes: session.durationMinutes,
    socialGain,
    hungerLoss,
  };
}

async function applySessionResolution(player, record, session, now = new Date()) {
  const resolution = buildSessionResolution(session, now);

  player.social = clampStat((player.social || 0) + resolution.socialGain);
  player.hunger = clampStat((player.hunger || 0) - resolution.hungerLoss);
  player.lastCare = player.lastCare || {};
  player.lastCare.socialPlay = now;

  record.history = record.history || [];
  record.history.unshift({
    startedAt: session.startedAt,
    endedAt: now,
    durationMinutes: session.durationMinutes,
    elapsedMinutes: resolution.elapsedMinutes,
    completed: resolution.completed,
    socialGain: resolution.socialGain,
    hungerLoss: resolution.hungerLoss,
  });
  record.history = record.history.slice(0, 20);
  record.activeSession = null;

  const writes = [
    playerRepository.savePlayer(player),
    playerParkRepository.savePlayerPark(record),
  ];

  if (resolution.socialGain > 0) {
    writes.push(progressionService.recordSocialAction(player.userId, 1, now));
    writes.push(globalEventService.recordContribution(player.userId, 1, now));
  }

  await Promise.all(writes);

  return {
    ...resolution,
    socialNow: player.social,
    hungerNow: player.hunger,
  };
}

function serializeSession(session, now = new Date()) {
  if (!session) {
    return null;
  }

  const startedAtMs = new Date(session.startedAt).getTime();
  const resolvedAtMs = new Date(session.resolvedAt).getTime();
  const durationMs = Math.max(1, resolvedAtMs - startedAtMs);
  const elapsedMs = clamp(now.getTime() - startedAtMs, 0, durationMs);
  const progress = elapsedMs / durationMs;

  return {
    startedAt: session.startedAt,
    resolvedAt: session.resolvedAt,
    durationMinutes: session.durationMinutes,
    plannedSocialGain: session.plannedSocialGain,
    plannedHungerLoss: session.plannedHungerLoss,
    elapsedMinutes: Math.floor(elapsedMs / 60000),
    progress,
    status: isSessionActive(session, now) ? "active" : "ready",
    msRemaining: Math.max(0, resolvedAtMs - now.getTime()),
  };
}

async function ensureParkRecord(userId) {
  return playerParkRepository.upsertByUserId(userId, {});
}

async function sendToPark(userId, durationMinutes, now = new Date()) {
  const safeDuration = Number(durationMinutes);
  if (!DURATION_OPTIONS_MINUTES.includes(safeDuration)) {
    return {
      ok: false,
      reason: "invalid-duration",
      allowedDurations: DURATION_OPTIONS_MINUTES,
    };
  }

  const [player, adventureRecord] = await Promise.all([
    playerRepository.findByUserId(userId),
    playerAdventureRepository.findByUserId(userId),
  ]);

  if (!player) {
    return {
      ok: false,
      reason: "missing-player",
    };
  }

  if (
    adventureRecord?.activeRun &&
    !adventureRecord.activeRun.claimedAt &&
    now.getTime() < new Date(adventureRecord.activeRun.resolvedAt).getTime()
  ) {
    return {
      ok: false,
      reason: "adventuring",
    };
  }

  const parkRecord =
    (await playerParkRepository.findByUserId(userId)) ||
    (await ensureParkRecord(userId));

  if (parkRecord.activeSession) {
    const active = isSessionActive(parkRecord.activeSession, now);
    if (!active) {
      await applySessionResolution(
        player,
        parkRecord,
        parkRecord.activeSession,
        new Date(parkRecord.activeSession.resolvedAt)
      );
    } else {
      return {
        ok: false,
        reason: "already-active",
        session: serializeSession(parkRecord.activeSession, now),
      };
    }
  }

  const refreshedRecord =
    parkRecord.activeSession === null
      ? parkRecord
      : (await playerParkRepository.findByUserId(userId)) ||
        (await ensureParkRecord(userId));

  if (refreshedRecord.activeSession) {
    return {
      ok: false,
      reason: "already-active",
      session: serializeSession(refreshedRecord.activeSession, now),
    };
  }

  const planned = computePlannedEffects(safeDuration);
  const session = {
    startedAt: now,
    durationMinutes: safeDuration,
    resolvedAt: new Date(now.getTime() + safeDuration * 60 * 1000),
    plannedSocialGain: planned.socialGain,
    plannedHungerLoss: planned.hungerLoss,
  };

  refreshedRecord.activeSession = session;
  await playerParkRepository.savePlayerPark(refreshedRecord);

  return {
    ok: true,
    session: serializeSession(session, now),
  };
}

async function getParkStatus(userId, now = new Date()) {
  const [player, record, activeCount] = await Promise.all([
    playerRepository.findByUserId(userId),
    playerParkRepository.findByUserId(userId),
    playerParkRepository.countActive(now),
  ]);

  if (player && record?.activeSession && !isSessionActive(record.activeSession, now)) {
    await applySessionResolution(
      player,
      record,
      record.activeSession,
      new Date(record.activeSession.resolvedAt)
    );
    return {
      activeCount,
      session: null,
    };
  }

  return {
    activeCount,
    session: serializeSession(record?.activeSession || null, now),
  };
}

async function leavePark(userId, now = new Date()) {
  const [player, record] = await Promise.all([
    playerRepository.findByUserId(userId),
    playerParkRepository.findByUserId(userId),
  ]);

  if (!player) {
    return {
      ok: false,
      reason: "missing-player",
    };
  }

  if (!record?.activeSession) {
    return {
      ok: false,
      reason: "missing-session",
    };
  }

  const session = record.activeSession;
  const applied = await applySessionResolution(player, record, session, now);

  return {
    ok: true,
    ...applied,
  };
}

async function pullReadyAutoReturns(now = new Date()) {
  const records = await playerParkRepository.listReadyForAutoReturn(now);
  const resolvedUserIds = [];

  for (const record of records) {
    if (!record.activeSession) {
      continue;
    }

    const player = await playerRepository.findByUserId(record.userId);
    if (!player) {
      record.activeSession = null;
      await playerParkRepository.savePlayerPark(record);
      continue;
    }

    await applySessionResolution(
      player,
      record,
      record.activeSession,
      new Date(record.activeSession.resolvedAt)
    );
    resolvedUserIds.push(record.userId);
  }

  return {
    count: resolvedUserIds.length,
    userIds: resolvedUserIds,
  };
}

module.exports = {
  DURATION_OPTIONS_MINUTES,
  getParkStatus,
  isSessionActive,
  leavePark,
  pullReadyAutoReturns,
  sendToPark,
};
