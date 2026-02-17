const env = require("../config/env");
const playerRepository = require("../repositories/playerRepository");
const playerProgressRepository = require("../repositories/playerProgressRepository");
const sleepService = require("./sleepService");
const notificationService = require("./notificationService");
const { buildAmbientBehavior } = require("./dialogueService");
const progressionService = require("./progressionService");

function clampStat(value) {
  return Math.min(100, Math.max(0, value));
}

async function runAmbientTick(client, now = new Date()) {
  const players = await playerRepository.listAllPlayers();
  const cooldownMs = env.ambientBehaviorCooldownMinutes * 60 * 1000;
  let sent = 0;

  for (const player of players) {
    if (!player.ambientOptIn) {
      continue;
    }

    const progressResult = await progressionService.ensureProgress(player.userId, now);
    const progress = progressResult.progress;
    const lastSentAt = progress.ambient?.lastSentAt
      ? new Date(progress.ambient.lastSentAt).getTime()
      : 0;
    if (lastSentAt && now.getTime() - lastSentAt < cooldownMs) {
      continue;
    }

    if (Math.random() > env.ambientBehaviorChancePercent / 100) {
      continue;
    }

    const schedule = await sleepService.getScheduleForUser(player.userId);
    const sleeping = sleepService.isSleepingNow(schedule, now);
    const ambient = buildAmbientBehavior(player, { sleeping });

    if (!sleeping) {
      player.affection = clampStat((player.affection || 0) + 1);
      player.social = clampStat((player.social || 0) + 1);
      await playerRepository.savePlayer(player);
    }

    progress.ambient = progress.ambient || {};
    progress.ambient.lastSentAt = now;
    await playerProgressRepository.saveProgress(progress);

    await notificationService.sendAmbientBehaviorNotification(
      client,
      player.userId,
      player.kirbyName,
      ambient.mood,
      ambient.phrase
    );
    sent += 1;
  }

  return {
    playerCount: players.length,
    sent,
  };
}

module.exports = {
  runAmbientTick,
};
