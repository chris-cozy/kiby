const playerRepository = require("../repositories/playerRepository");
const npcRepository = require("../repositories/npcRepository");

function sortByProgress(a, b) {
  if (a.level !== b.level) {
    return b.level - a.level;
  }

  if (a.xp !== b.xp) {
    return b.xp - a.xp;
  }

  return a.kirbyName.localeCompare(b.kirbyName);
}

async function getMixedLeaderboard(limit = 10) {
  const [players, npcs] = await Promise.all([
    playerRepository.listAllPlayers(),
    npcRepository.listAll(),
  ]);

  const rows = [
    ...players.map((player) => ({
      type: "player",
      userId: player.userId,
      kirbyName: player.kirbyName,
      level: player.level,
      xp: player.xp,
      hp: player.hp,
      hunger: player.hunger,
      affection: player.affection,
    })),
    ...npcs.map((npc) => ({
      type: "npc",
      npcId: npc.npcId,
      kirbyName: npc.kirbyName,
      level: npc.level,
      xp: npc.xp,
      hp: npc.hp,
      hunger: npc.hunger,
      affection: npc.affection,
    })),
  ];

  rows.sort(sortByProgress);

  return {
    total: rows.length,
    rows,
    top: rows.slice(0, limit),
  };
}

module.exports = {
  getMixedLeaderboard,
};
