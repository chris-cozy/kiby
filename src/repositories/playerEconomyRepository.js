const PlayerEconomy = require("../schemas/playerEconomy");

async function findByUserId(userId) {
  return PlayerEconomy.findOne({ userId });
}

async function upsertByUserId(userId, payload = {}) {
  return PlayerEconomy.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
        starCoins: 100,
        inventory: {},
      },
      $set: payload,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function saveEconomy(economy) {
  return economy.save();
}

module.exports = {
  findByUserId,
  saveEconomy,
  upsertByUserId,
};
