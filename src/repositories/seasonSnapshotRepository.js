const SeasonSnapshot = require("../schemas/seasonSnapshot");

async function findBySeasonKey(seasonKey) {
  return SeasonSnapshot.findOne({ seasonKey });
}

async function createSnapshot(payload) {
  const snapshot = new SeasonSnapshot(payload);
  return snapshot.save();
}

module.exports = {
  createSnapshot,
  findBySeasonKey,
};
