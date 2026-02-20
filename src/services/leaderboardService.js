const playerRepository = require("../repositories/playerRepository");
const npcRepository = require("../repositories/npcRepository");
const seasonService = require("./seasonService");
const titleService = require("./titleService");

function sortByProgress(a, b) {
  if (a.level !== b.level) {
    return b.level - a.level;
  }

  if (a.xp !== b.xp) {
    return b.xp - a.xp;
  }

  return a.kirbyName.localeCompare(b.kirbyName);
}

function annotatePlayerRow(player, titleMap) {
  const title = titleMap.get(player.userId);
  return {
    type: "player",
    userId: player.userId,
    kirbyName: player.kirbyName,
    level: player.level,
    xp: player.xp,
    hp: player.hp,
    hunger: player.hunger,
    affection: player.affection,
    social: player.social,
    titleId: title?.id || "",
    titleLabel: title?.label || "",
  };
}

function annotateNpcRow(npc) {
  return {
    type: "npc",
    npcId: npc.npcId,
    kirbyName: npc.kirbyName,
    level: npc.level,
    xp: npc.xp,
    hp: npc.hp,
    hunger: npc.hunger,
    affection: npc.affection,
    social: npc.social,
    titleId: "",
    titleLabel: "",
  };
}

async function getTotalLeaderboard(limit = 10, options = {}) {
  const [players, npcs] = await Promise.all([
    playerRepository.listAllPlayers(),
    options.playersOnly ? Promise.resolve([]) : npcRepository.listAll(),
  ]);
  const titleMap = await titleService.getEquippedTitleMap(
    players.map((player) => player.userId)
  );

  const rows = [
    ...players.map((player) => annotatePlayerRow(player, titleMap)),
    ...npcs.map(annotateNpcRow),
  ];
  rows.sort(sortByProgress);

  return {
    mode: options.playersOnly ? "players" : "total",
    total: rows.length,
    rows,
    top: rows.slice(0, limit),
  };
}

async function getSeasonLeaderboard(limit = 10, options = {}, now = new Date()) {
  const seasonBoard = await seasonService.getSeasonLeaderboard(
    limit,
    {
      playersOnly: Boolean(options.playersOnly),
    },
    now
  );
  const playerIds = seasonBoard.rows
    .filter((row) => row.entityType === "player")
    .map((row) => row.userId || row.entityId);
  const titleMap = await titleService.getEquippedTitleMap(playerIds);

  const rows = seasonBoard.rows.map((row) => {
    if (row.entityType === "player") {
      const userId = row.userId || row.entityId;
      const title = titleMap.get(userId);
      return {
        type: "player",
        userId,
        kirbyName: row.kirbyName,
        level: row.level,
        xp: row.xp,
        titleId: title?.id || "",
        titleLabel: title?.label || "",
      };
    }

    return {
      type: "npc",
      npcId: row.npcId || row.entityId,
      kirbyName: row.kirbyName,
      level: row.level,
      xp: row.xp,
      titleId: "",
      titleLabel: "",
    };
  });

  rows.sort(sortByProgress);

  return {
    mode: options.playersOnly ? "players-season" : "season",
    seasonKey: seasonBoard.seasonKey,
    seasonStartsAt: seasonBoard.seasonStartsAt,
    seasonEndsAt: seasonBoard.seasonEndsAt,
    total: rows.length,
    rows,
    top: rows.slice(0, limit),
  };
}

async function getLeaderboard(options = {}, now = new Date()) {
  const safeLimit = Math.max(1, Math.min(50, Number(options.limit) || 10));
  const mode = options.mode || "total";

  if (mode === "season") {
    return getSeasonLeaderboard(safeLimit, options, now);
  }

  return getTotalLeaderboard(safeLimit, {
    playersOnly: mode === "players" || Boolean(options.playersOnly),
  });
}

async function getMixedLeaderboard(limit = 10) {
  return getLeaderboard({ mode: "total", limit });
}

module.exports = {
  getLeaderboard,
  getMixedLeaderboard,
  getSeasonLeaderboard,
  getTotalLeaderboard,
};
