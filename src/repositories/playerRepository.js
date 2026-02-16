const PlayerProfile = require("../schemas/playerProfile");

async function findByUserId(userId) {
  return PlayerProfile.findOne({ userId });
}

async function createPlayer(payload) {
  const player = new PlayerProfile(payload);
  return player.save();
}

async function savePlayer(player) {
  return player.save();
}

async function deleteByUserId(userId) {
  return PlayerProfile.deleteOne({ userId });
}

async function listAllPlayers() {
  return PlayerProfile.find();
}

module.exports = {
  createPlayer,
  deleteByUserId,
  findByUserId,
  listAllPlayers,
  savePlayer,
};
