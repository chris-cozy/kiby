const PlayerAdventure = require("../schemas/playerAdventure");

async function findByUserId(userId) {
  return PlayerAdventure.findOne({ userId });
}

async function upsertByUserId(userId, payload = {}) {
  return PlayerAdventure.findOneAndUpdate(
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

async function saveAdventure(adventure) {
  return adventure.save();
}

async function countActiveByRoute(now = new Date()) {
  const rows = await PlayerAdventure.aggregate([
    {
      $match: {
        activeRun: { $ne: null },
        "activeRun.claimedAt": null,
        "activeRun.resolvedAt": { $gt: now },
      },
    },
    {
      $group: {
        _id: "$activeRun.routeId",
        count: { $sum: 1 },
      },
    },
  ]);

  return rows.map((row) => ({
    routeId: row._id,
    count: row.count,
  }));
}

async function listRunsReadyForNotification(now = new Date()) {
  return PlayerAdventure.find({
    activeRun: { $ne: null },
    "activeRun.claimedAt": null,
    "activeRun.completionNotifiedAt": null,
    "activeRun.resolvedAt": { $lte: now },
  });
}

module.exports = {
  countActiveByRoute,
  findByUserId,
  listRunsReadyForNotification,
  saveAdventure,
  upsertByUserId,
};
