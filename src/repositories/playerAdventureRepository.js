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

module.exports = {
  findByUserId,
  saveAdventure,
  upsertByUserId,
};
