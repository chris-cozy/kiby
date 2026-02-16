const DeathHistory = require("../schemas/deathHistory");

async function createDeathRecord(payload) {
  const record = new DeathHistory(payload);
  return record.save();
}

async function findLatestPlayerDeath(userId) {
  return DeathHistory.findOne({
    entityType: "player",
    userId,
  }).sort({ deathAt: -1 });
}

module.exports = {
  createDeathRecord,
  findLatestPlayerDeath,
};
