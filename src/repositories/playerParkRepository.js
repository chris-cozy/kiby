const PlayerPark = require("../schemas/playerPark");

async function findByUserId(userId) {
  return PlayerPark.findOne({ userId });
}

async function upsertByUserId(userId, payload = {}) {
  return PlayerPark.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
      },
      $set: payload,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function savePlayerPark(record) {
  return record.save();
}

async function countActive(now = new Date()) {
  return PlayerPark.countDocuments({
    activeSession: { $ne: null },
    "activeSession.resolvedAt": { $gt: now },
  });
}

async function listReadyForAutoReturn(now = new Date()) {
  return PlayerPark.find({
    activeSession: { $ne: null },
    "activeSession.resolvedAt": { $lte: now },
  });
}

module.exports = {
  countActive,
  findByUserId,
  listReadyForAutoReturn,
  savePlayerPark,
  upsertByUserId,
};
