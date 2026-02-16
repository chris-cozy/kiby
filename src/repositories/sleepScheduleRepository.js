const SleepSchedule = require("../schemas/sleepSchedule");

async function findByUserId(userId) {
  return SleepSchedule.findOne({ userId });
}

async function upsertByUserId(userId, payload) {
  return SleepSchedule.findOneAndUpdate(
    { userId },
    { $set: payload },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function deleteByUserId(userId) {
  return SleepSchedule.deleteOne({ userId });
}

async function listAllSchedules() {
  return SleepSchedule.find();
}

async function listByUserIds(userIds) {
  if (!userIds.length) {
    return [];
  }

  return SleepSchedule.find({
    userId: { $in: userIds },
  });
}

module.exports = {
  deleteByUserId,
  findByUserId,
  listAllSchedules,
  listByUserIds,
  upsertByUserId,
};
