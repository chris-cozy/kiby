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

async function listByUserIds(userIds = []) {
  if (!userIds.length) {
    return [];
  }

  return PlayerProgress.find({ userId: { $in: userIds } });
}

async function countActiveSince(since) {
  return PlayerProgress.countDocuments({
    lastActionAt: { $gte: since },
  });
}

module.exports = {
  countActiveSince,
  findByUserId,
  listByUserIds,
  saveProgress,
  upsertByUserId,
};
