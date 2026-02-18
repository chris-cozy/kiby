const env = require("../config/env");
const playerRepository = require("../repositories/playerRepository");
const sleepService = require("./sleepService");
const economyService = require("./economyService");
const progressionService = require("./progressionService");
const sanitizeKirbyName = require("../utils/sanitizeKirbyName");

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

  const player = await playerRepository.createPlayer({
    userId,
    kirbyName: safeName,
    adoptedAt: new Date(),
    lastCare: {
      feed: new Date(),
      pet: new Date(),
      play: new Date(),
      cuddle: new Date(),
      train: new Date(),
      bathe: new Date(),
      socialPlay: new Date(),
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
