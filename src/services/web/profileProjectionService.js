/**
 * Shared profile projection for future web client/API surfaces.
 */

function toWebProfile(player, sleepSummary) {
  return {
    userId: player.userId,
    kirbyName: player.kirbyName,
    level: player.level,
    xp: player.xp,
    hp: player.hp,
    hunger: player.hunger,
    affection: player.affection,
    adoptedAt: player.adoptedAt,
    sleep: {
      timezone: sleepSummary.timezone,
      startLocalTime: sleepSummary.startLocalTime,
      durationHours: sleepSummary.durationHours,
      sleeping: sleepSummary.sleeping,
    },
  };
}

module.exports = {
  toWebProfile,
};
