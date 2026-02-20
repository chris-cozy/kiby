const env = require("../config/env");
const { applyLevelProgression } = require("../domain/progression/calculateXpForLevel");
const { getSeasonContext } = require("../domain/season/season");
const seasonEntryRepository = require("../repositories/seasonEntryRepository");
const seasonSnapshotRepository = require("../repositories/seasonSnapshotRepository");
const seasonStateRepository = require("../repositories/seasonStateRepository");

function sortRows(a, b) {
  if (a.level !== b.level) {
    return b.level - a.level;
  }

  if (a.xp !== b.xp) {
    return b.xp - a.xp;
  }

  return a.kirbyName.localeCompare(b.kirbyName);
}

async function maybeSnapshotSeason(state) {
  const previousKey = state.currentSeasonKey;
  if (!previousKey) {
    return;
  }

  if (state.lastSnapshottedSeasonKey === previousKey) {
    return;
  }

  const existingSnapshot = await seasonSnapshotRepository.findBySeasonKey(previousKey);
  if (existingSnapshot) {
    state.lastSnapshottedSeasonKey = previousKey;
    return;
  }

  const topRows = await seasonEntryRepository.listTopBySeason(previousKey, 100);
  await seasonSnapshotRepository.createSnapshot({
    seasonKey: previousKey,
    seasonLengthDays: state.seasonLengthDays === 14 ? 14 : 7,
    startsAt: state.currentStartAt || new Date(),
    endsAt: state.currentEndAt || new Date(),
    rows: topRows.map((row, index) => ({
      rank: index + 1,
      entityType: row.entityType,
      entityId: row.entityId,
      kirbyName: row.kirbyName,
      level: row.level,
      xp: row.xp,
    })),
    generatedAt: new Date(),
  });
  state.lastSnapshottedSeasonKey = previousKey;
}

async function ensureSeasonState(now = new Date()) {
  const state = await seasonStateRepository.getGlobalState();
  const context = getSeasonContext(now, env.seasonLengthDays);
  let changed = false;

  if (!state.currentSeasonKey) {
    state.currentSeasonKey = context.key;
    state.currentStartAt = context.startAt;
    state.currentEndAt = context.endAt;
    state.seasonLengthDays = context.seasonLengthDays;
    changed = true;
  } else if (state.currentSeasonKey !== context.key) {
    await maybeSnapshotSeason(state);
    state.currentSeasonKey = context.key;
    state.currentStartAt = context.startAt;
    state.currentEndAt = context.endAt;
    state.seasonLengthDays = context.seasonLengthDays;
    changed = true;
  } else if (state.seasonLengthDays !== context.seasonLengthDays) {
    state.seasonLengthDays = context.seasonLengthDays;
    changed = true;
  }

  if (changed) {
    await seasonStateRepository.saveState(state);
  }

  return {
    ...context,
    seasonKey: context.key,
  };
}

async function recordEntityProgress(
  entityType,
  entityId,
  kirbyName,
  xpGranted,
  now = new Date()
) {
  const safeXp = Math.max(0, Number(xpGranted) || 0);
  if (safeXp < 1) {
    return null;
  }

  const season = await ensureSeasonState(now);
  let entry = await seasonEntryRepository.findBySeasonAndEntity(
    season.key,
    entityType,
    entityId
  );

  if (!entry) {
    entry = await seasonEntryRepository.upsertBySeasonAndEntity(
      season.key,
      entityType,
      entityId,
      {
        userId: entityType === "player" ? entityId : "",
        npcId: entityType === "npc" ? entityId : "",
        kirbyName,
        level: 1,
        xp: 0,
        updatedAtSeason: now,
      }
    );
  }

  entry.kirbyName = kirbyName;
  entry.xp += safeXp;
  const seasonProgress = applyLevelProgression(entry.level, entry.xp);
  entry.level = seasonProgress.level;
  entry.xp = seasonProgress.xp;
  entry.updatedAtSeason = now;
  await seasonEntryRepository.saveEntry(entry);

  return entry;
}

async function getSeasonLeaderboard(limit = 10, options = {}, now = new Date()) {
  const season = await ensureSeasonState(now);
  const rows = await seasonEntryRepository.listBySeason(season.key);
  const filtered = options.playersOnly
    ? rows.filter((row) => row.entityType === "player")
    : rows;

  filtered.sort(sortRows);

  return {
    mode: "season",
    seasonKey: season.key,
    seasonStartsAt: season.startAt,
    seasonEndsAt: season.endAt,
    total: filtered.length,
    rows: filtered,
    top: filtered.slice(0, limit),
  };
}

module.exports = {
  ensureSeasonState,
  getSeasonLeaderboard,
  recordEntityProgress,
};
