const SeasonEntry = require("../schemas/seasonEntry");

async function findBySeasonAndEntity(seasonKey, entityType, entityId) {
  return SeasonEntry.findOne({ seasonKey, entityType, entityId });
}

async function upsertBySeasonAndEntity(seasonKey, entityType, entityId, payload = {}) {
  return SeasonEntry.findOneAndUpdate(
    { seasonKey, entityType, entityId },
    {
      $setOnInsert: {
        seasonKey,
        entityType,
        entityId,
      },
      $set: payload,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function listBySeason(seasonKey) {
  return SeasonEntry.find({ seasonKey });
}

async function listTopBySeason(seasonKey, limit = 10) {
  return SeasonEntry.find({ seasonKey })
    .sort({ level: -1, xp: -1, kirbyName: 1 })
    .limit(limit);
}

async function saveEntry(entry) {
  return entry.save();
}

module.exports = {
  findBySeasonAndEntity,
  listBySeason,
  listTopBySeason,
  saveEntry,
  upsertBySeasonAndEntity,
};
