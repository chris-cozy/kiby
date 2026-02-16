const PlayerProgress = require("../schemas/playerProgress");

async function findByUserId(userId) {
  return PlayerProgress.findOne({ userId });
}

async function upsertByUserId(userId, payload = {}) {
  return PlayerProgress.findOneAndUpdate(
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

async function saveProgress(progress) {
  return progress.save();
}

module.exports = {
  findByUserId,
  saveProgress,
  upsertByUserId,
};
