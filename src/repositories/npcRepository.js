const NpcProfile = require("../schemas/npcProfile");

async function countAll() {
  return NpcProfile.countDocuments();
}

async function findByNpcId(npcId) {
  return NpcProfile.findOne({ npcId });
}

async function createMany(payload) {
  return NpcProfile.insertMany(payload);
}

async function listAll() {
  return NpcProfile.find();
}

async function saveNpc(npc) {
  return npc.save();
}

async function deleteAll() {
  return NpcProfile.deleteMany({});
}

module.exports = {
  countAll,
  createMany,
  deleteAll,
  findByNpcId,
  listAll,
  saveNpc,
};
