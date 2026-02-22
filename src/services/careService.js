const env = require("../config/env");
const { applyCareAction, applyDecay } = require("../domain/care/rules");
const playerRepository = require("../repositories/playerRepository");
const sleepScheduleRepository = require("../repositories/sleepScheduleRepository");
const playerAdventureRepository = require("../repositories/playerAdventureRepository");
const sleepService = require("./sleepService");
const progressionService = require("./progressionService");
const deathHistoryRepository = require("../repositories/deathHistoryRepository");
const seasonService = require("./seasonService");
const globalEventService = require("./globalEventService");
const battlePowerService = require("./battlePowerService");
const onboardingService = require("./onboardingService");

async function runActionForUser(userId, actionName, now = new Date()) {
  const player = await playerRepository.findByUserId(userId);
  if (!player) {
    return {
      ok: false,
      reason: "missing-player",
    };
  }

  const adventureRecord = await playerAdventureRepository.findByUserId(userId);
  if (
    adventureRecord?.activeRun &&
    !adventureRecord.activeRun.claimedAt &&
    now.getTime() < new Date(adventureRecord.activeRun.resolvedAt).getTime()
  ) {
    return {
      ok: false,
      reason: "adventuring",
      player,
      run: adventureRecord.activeRun,
    };
  }

  const schedule = await sleepService.getScheduleForUser(userId);
  const sleeping = sleepService.isSleepingNow(schedule, now);

  if (sleeping && !["pet", "cuddle"].includes(actionName)) {
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

  if (actionName === "train") {
    const bpResult = battlePowerService.applyTrainingGain(player, now);
    actionResult.updates.battlePower = bpResult.battlePower;
    actionResult.updates.battlePowerGain = bpResult.gain;
    actionResult.updates.battlePowerDecayed = bpResult.decayed;
  } else {
    const decayResult = battlePowerService.applyLazyDecay(player, now, { touch: false });
    actionResult.updates.battlePower = player.battlePower || 0;
    actionResult.updates.battlePowerDecayed = decayResult.decayed;
    actionResult.updates.battlePowerGain = 0;
  }

  await playerRepository.savePlayer(player);
  await Promise.all([
    progressionService.recordCareAction(userId, actionName, now),
    seasonService.recordEntityProgress(
      "player",
      userId,
      player.kirbyName,
      actionResult.updates.xpGranted,
      now
    ),
    globalEventService.recordContribution(userId, 1, now),
  ]);

  let tutorial = null;
  try {
    tutorial = await onboardingService.recordEvent(
      userId,
      actionName === "train" ? "training-action" : "care-action",
      { actionName },
      now
    );
  } catch {
    tutorial = null;
  }

  return {
    ok: true,
    player,
    schedule,
    updates: actionResult.updates,
    tutorial,
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

    if (decayResult.events.socialDroppedBelowThreshold) {
      notifications.push({
        type: "social",
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
