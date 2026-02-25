const env = require("../config/env");
const playerRepository = require("../repositories/playerRepository");
const npcRepository = require("../repositories/npcRepository");
const playerAdventureRepository = require("../repositories/playerAdventureRepository");
const playerParkRepository = require("../repositories/playerParkRepository");
const npcService = require("./npcService");
const progressionService = require("./progressionService");
const globalEventService = require("./globalEventService");
const logger = require("../utils/logger");

const PLAYDATE_EFFECTS = Object.freeze({
  senderSocial: 8,
  targetAffection: 4,
  targetSocial: 8,
});

function clampStat(value) {
  return Math.min(100, Math.max(0, value));
}

function getRemainingCooldownMs(lastAt, cooldownMinutes, now = new Date()) {
  if (!lastAt) {
    return 0;
  }

  const elapsed = now.getTime() - new Date(lastAt).getTime();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  return elapsed >= cooldownMs ? 0 : cooldownMs - elapsed;
}

function hasActiveAdventure(record, now = new Date()) {
  return Boolean(
    record?.activeRun &&
      !record.activeRun.claimedAt &&
      now.getTime() < new Date(record.activeRun.resolvedAt).getTime()
  );
}

function hasActivePark(record, now = new Date()) {
  return Boolean(
    record?.activeSession &&
      now.getTime() < new Date(record.activeSession.resolvedAt).getTime()
  );
}

function buildTargetToken(type, id) {
  return `${type}:${id}`;
}

function parseTargetToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const [type, id] = token.split(":");
  if (!type || !id) {
    return null;
  }

  if (type !== "player" && type !== "npc") {
    return null;
  }

  return {
    type,
    id,
  };
}

async function loadNpcsWithSeedFallback() {
  let npcs = await npcRepository.listAll();
  if (!npcs.length) {
    await npcService.ensureNpcSeeded();
    npcs = await npcRepository.listAll();
  }
  return npcs;
}

function sortByQuery(a, b, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) {
    return a.name.localeCompare(b.name);
  }

  const aStarts = a.name.toLowerCase().startsWith(q);
  const bStarts = b.name.toLowerCase().startsWith(q);
  if (aStarts !== bStarts) {
    return aStarts ? -1 : 1;
  }

  return a.name.localeCompare(b.name);
}

async function setSocialOptIn(userId, enabled) {
  const player = await playerRepository.findByUserId(userId);
  if (!player) {
    return {
      ok: false,
      reason: "missing-player",
    };
  }

  player.socialOptIn = Boolean(enabled);
  await playerRepository.savePlayer(player);
  return {
    ok: true,
    enabled: player.socialOptIn,
  };
}

async function listPlaydateTargets(query = "", limit = 25, actorUserId = "") {
  const [players, npcs] = await Promise.all([
    playerRepository.listAllPlayers(),
    loadNpcsWithSeedFallback(),
  ]);
  const normalized = (query || "").trim().toLowerCase();
  const maxRows = Math.max(1, Math.min(25, Number(limit) || 25));

  const playerRows = players
    .filter((row) => row.userId !== actorUserId)
    .map((row) => ({
      type: "player",
      id: row.userId,
      name: `${row.kirbyName}`,
      value: buildTargetToken("player", row.userId),
      search: `${row.kirbyName} ${row.userId}`.toLowerCase(),
      kirbyName: row.kirbyName,
    }));

  const npcRows = npcs.map((row) => ({
    type: "npc",
    id: row.npcId,
    name: `${row.kirbyName} ✧`,
    value: buildTargetToken("npc", row.npcId),
    search: `${row.kirbyName} ${row.displayName || ""} ${row.npcId}`.toLowerCase(),
    kirbyName: row.kirbyName,
  }));

  const allRows = [...playerRows, ...npcRows];
  const filteredRows = allRows
    .filter((row) => !normalized || row.search.includes(normalized))
    .sort((a, b) => sortByQuery(a, b, normalized));
  const displayRows = (filteredRows.length ? filteredRows : allRows)
    .sort((a, b) => sortByQuery(a, b, normalized))
    .slice(0, maxRows)
    .map((row) => ({
      name: row.name.slice(0, 100),
      value: row.value.slice(0, 100),
      type: row.type,
      id: row.id,
      kirbyName: row.kirbyName,
    }));

  return displayRows;
}

function matchBySelector(rows, selector = "") {
  const normalized = String(selector || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const exact = rows.find(
    (row) =>
      String(row.kirbyName || "").toLowerCase() === normalized ||
      String(row.id || "").toLowerCase() === normalized
  );
  if (exact) {
    return exact;
  }

  return (
    rows.find((row) => String(row.kirbyName || "").toLowerCase().includes(normalized)) ||
    rows.find((row) => String(row.id || "").toLowerCase().includes(normalized)) ||
    null
  );
}

async function resolveTargetFromTokenOrSelector(targetTokenOrSelector) {
  const raw = String(targetTokenOrSelector || "").trim();
  if (!raw) {
    return null;
  }

  const parsed = parseTargetToken(raw);
  if (parsed) {
    if (parsed.type === "player") {
      const player = await playerRepository.findByUserId(parsed.id);
      if (!player) {
        return null;
      }

      return {
        type: "player",
        id: player.userId,
        player,
      };
    }

    const npc = await npcRepository.findByNpcId(parsed.id);
    if (npc) {
      return {
        type: "npc",
        id: npc.npcId,
        npc,
      };
    }

    const seededNpcs = await loadNpcsWithSeedFallback();
    const seededNpc = seededNpcs.find((row) => row.npcId === parsed.id);
    if (!seededNpc) {
      return null;
    }

    return {
      type: "npc",
      id: seededNpc.npcId,
      npc: seededNpc,
    };
  }

  const [players, npcs] = await Promise.all([
    playerRepository.listAllPlayers(),
    loadNpcsWithSeedFallback(),
  ]);

  const matchedPlayer = matchBySelector(
    players.map((row) => ({
      id: row.userId,
      kirbyName: row.kirbyName,
      player: row,
    })),
    raw
  );
  if (matchedPlayer) {
    return {
      type: "player",
      id: matchedPlayer.id,
      player: matchedPlayer.player,
    };
  }

  const matchedNpc = matchBySelector(
    npcs.map((row) => ({
      id: row.npcId,
      kirbyName: row.kirbyName,
      npc: row,
    })),
    raw
  );
  if (matchedNpc) {
    return {
      type: "npc",
      id: matchedNpc.id,
      npc: matchedNpc.npc,
    };
  }

  return null;
}

async function runPlaydate(userId, targetToken, now = new Date()) {
  const sender = await playerRepository.findByUserId(userId);
  if (!sender) {
    return {
      ok: false,
      reason: "missing-player",
    };
  }

  const [adventureRecord, parkRecord, targetEntity] = await Promise.all([
    playerAdventureRepository.findByUserId(userId),
    playerParkRepository.findByUserId(userId),
    resolveTargetFromTokenOrSelector(targetToken),
  ]);

  if (hasActiveAdventure(adventureRecord, now)) {
    return {
      ok: false,
      reason: "adventuring",
    };
  }

  if (hasActivePark(parkRecord, now)) {
    return {
      ok: false,
      reason: "at-park",
    };
  }

  if (!targetEntity) {
    return {
      ok: false,
      reason: "missing-target",
    };
  }

  if (targetEntity.type === "player" && targetEntity.player.userId === userId) {
    return {
      ok: false,
      reason: "self-target",
    };
  }

  const senderWaitMs = getRemainingCooldownMs(sender.lastPlaydateAt, 30, now);
  if (senderWaitMs > 0) {
    return {
      ok: false,
      reason: "cooldown",
      waitMs: senderWaitMs,
    };
  }

  if (targetEntity.type === "player") {
    const target = targetEntity.player;

    if (!target.socialOptIn) {
      return {
        ok: false,
        reason: "target-opted-out",
      };
    }

    const targetWaitMs = getRemainingCooldownMs(
      target.lastCare?.socialReceived,
      env.socialReceiveCooldownMinutes,
      now
    );
    if (targetWaitMs > 0) {
      logger.info("Playdate denied by receiver cooldown", {
        senderUserId: userId,
        targetUserId: target.userId,
        waitMs: targetWaitMs,
      });
      return {
        ok: false,
        reason: "target-cooldown",
        waitMs: targetWaitMs,
      };
    }
  }

  sender.social = clampStat((sender.social || 0) + PLAYDATE_EFFECTS.senderSocial);
  sender.lastCare = sender.lastCare || {};
  sender.lastCare.socialPlay = now;
  sender.lastPlaydateAt = now;

  let targetAffectionNow = 0;
  let targetSocialNow = 0;
  let targetKirbyName = "";
  let targetOwnerUserId = "";
  if (targetEntity.type === "player") {
    const target = targetEntity.player;
    target.affection = clampStat((target.affection || 0) + PLAYDATE_EFFECTS.targetAffection);
    target.social = clampStat((target.social || 0) + PLAYDATE_EFFECTS.targetSocial);
    target.lastCare = target.lastCare || {};
    target.lastCare.socialReceived = now;
    targetAffectionNow = target.affection;
    targetSocialNow = target.social;
    targetKirbyName = target.kirbyName;
    targetOwnerUserId = target.userId;
  } else {
    const target = targetEntity.npc;
    target.affection = clampStat((target.affection || 0) + PLAYDATE_EFFECTS.targetAffection);
    target.social = clampStat((target.social || 0) + PLAYDATE_EFFECTS.targetSocial);
    target.lastCare = target.lastCare || {};
    target.lastCare.socialPlay = now;
    targetAffectionNow = target.affection;
    targetSocialNow = target.social;
    targetKirbyName = target.kirbyName;
  }

  const saves = [playerRepository.savePlayer(sender)];
  if (targetEntity.type === "player") {
    saves.push(playerRepository.savePlayer(targetEntity.player));
  } else {
    saves.push(npcRepository.saveNpc(targetEntity.npc));
  }

  await Promise.all([
    ...saves,
    progressionService.recordSocialAction(userId, 1, now),
    globalEventService.recordContribution(userId, 1, now),
  ]);

  return {
    ok: true,
    targetType: targetEntity.type,
    targetId: targetEntity.id,
    targetKirbyName,
    targetOwnerUserId,
    senderGain: PLAYDATE_EFFECTS.senderSocial,
    senderSocialNow: sender.social,
    targetAffectionGain: PLAYDATE_EFFECTS.targetAffection,
    targetAffectionNow,
    targetSocialGain: PLAYDATE_EFFECTS.targetSocial,
    targetSocialNow,
  };
}

module.exports = {
  listPlaydateTargets,
  parseTargetToken,
  runPlaydate,
  setSocialOptIn,
};
