const env = require("../config/env");
const { applyCareAction, applyDecay } = require("../domain/care/rules");
const playerRepository = require("../repositories/playerRepository");
const sleepScheduleRepository = require("../repositories/sleepScheduleRepository");
const sleepService = require("./sleepService");
const progressionService = require("./progressionService");
const deathHistoryRepository = require("../repositories/deathHistoryRepository");

async function runActionForUser(userId, actionName, now = new Date()) {
  const player = await playerRepository.findByUserId(userId);
  if (!player) {
    return {
      ok: false,
      reason: "missing-player",
    };
  }

  const schedule = await sleepService.getScheduleForUser(userId);
  const sleeping = sleepService.isSleepingNow(schedule, now);

  if (sleeping && actionName !== "pet") {
    return {
      ok: false,
      reason: "asleep",
      player,
      schedule,
    };
  }

  const actionResult = applyCareAction(player, actionName, now);
  if (!actionResult.ok) {
    return {
      ok: false,
      reason: actionResult.reason,
      waitMs: actionResult.waitMs,
      cooldownMinutes: actionResult.cooldownMinutes,
      player,
      schedule,
    };
  }

  await playerRepository.savePlayer(player);
  await progressionService.recordCareAction(userId, actionName, now);

  return {
    ok: true,
    player,
    schedule,
    updates: actionResult.updates,
  };
}

async function runPlayerDecayTick(now = new Date()) {
  const players = await playerRepository.listAllPlayers();
  const userIds = players.map((player) => player.userId);
  const existingSchedules = await sleepScheduleRepository.listByUserIds(userIds);
  const scheduleMap = new Map(
    existingSchedules.map((schedule) => [schedule.userId, schedule])
  );
  const notifications = [];
  const deaths = [];

  for (const player of players) {
    let schedule = scheduleMap.get(player.userId);
    if (!schedule) {
      schedule = await sleepService.getScheduleForUser(player.userId);
      scheduleMap.set(player.userId, schedule);
    }
    if (sleepService.isSleepingNow(schedule, now)) {
      continue;
    }

    const decayResult = applyDecay(player, {
      now,
      neglectThresholdMs: env.neglectThresholdMinutes * 60 * 1000,
      notificationThreshold: env.notificationThreshold,
    });

    if (decayResult.events.hungerDroppedBelowThreshold) {
      notifications.push({
        type: "hunger",
        userId: player.userId,
        kirbyName: player.kirbyName,
      });
    }

    if (decayResult.events.affectionDroppedBelowThreshold) {
      notifications.push({
        type: "affection",
        userId: player.userId,
        kirbyName: player.kirbyName,
      });
    }

    if (decayResult.events.died) {
      await deathHistoryRepository.createDeathRecord({
        entityType: "player",
        userId: player.userId,
        kirbyName: player.kirbyName,
        level: player.level,
        adoptedAt: player.adoptedAt,
        deathAt: now,
        reason: "neglect",
      });

      await playerRepository.deleteByUserId(player.userId);
      deaths.push({
        userId: player.userId,
        kirbyName: player.kirbyName,
      });
      continue;
    }

    await playerRepository.savePlayer(player);
  }

  return {
    playerCount: players.length,
    notifications,
    deaths,
  };
}

module.exports = {
  runActionForUser,
  runPlayerDecayTick,
};
