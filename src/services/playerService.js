const env = require("../config/env");
const playerRepository = require("../repositories/playerRepository");
const sleepService = require("./sleepService");
const economyService = require("./economyService");
const progressionService = require("./progressionService");
const sanitizeKirbyName = require("../utils/sanitizeKirbyName");
const { getActionCooldownMs } = require("../domain/care/rules");

async function getPlayerByUserId(userId) {
  return playerRepository.findByUserId(userId);
}

async function adoptPlayer(userId, kirbyName) {
  const existing = await playerRepository.findByUserId(userId);
  if (existing) {
    return {
      created: false,
      player: existing,
    };
  }

  const safeName = sanitizeKirbyName(kirbyName, env.maxKirbyNameLength);
  const adoptedAt = new Date();
  const petReadyAt = new Date(adoptedAt.getTime() - getActionCooldownMs("pet"));
  const trainReadyAt = new Date(adoptedAt.getTime() - getActionCooldownMs("train"));

  const player = await playerRepository.createPlayer({
    userId,
    kirbyName: safeName,
    adoptedAt,
    lastPlaydateAt: null,
    lastCare: {
      feed: adoptedAt,
      pet: petReadyAt,
      play: adoptedAt,
      cuddle: adoptedAt,
      train: trainReadyAt,
      bathe: adoptedAt,
      socialPlay: null,
      socialReceived: null,
    },
  });

  await sleepService.getScheduleForUser(userId);
  await Promise.all([
    economyService.ensureEconomy(userId),
    progressionService.ensureProgress(userId),
  ]);

  return {
    created: true,
    player,
  };
}

module.exports = {
  adoptPlayer,
  getPlayerByUserId,
};
