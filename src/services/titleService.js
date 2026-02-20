const playerRepository = require("../repositories/playerRepository");
const progressionService = require("./progressionService");
const economyService = require("./economyService");
const playerProgressRepository = require("../repositories/playerProgressRepository");

const TITLE_DEFINITIONS = [
  {
    id: "star-rookie",
    label: "Star Rookie",
    description: "Reach level 5.",
    check: ({ player }) => Boolean(player && player.level >= 5),
  },
  {
    id: "streaker",
    label: "Streaker",
    description: "Maintain a 7-day daily streak.",
    check: ({ progress }) => Boolean(progress && progress.dailyStreak >= 7),
  },
  {
    id: "quest-runner",
    label: "Quest Runner",
    description: "Claim 15 quest rewards.",
    check: ({ progress }) => Boolean(progress && progress.lifetime?.questClaims >= 15),
  },
  {
    id: "socialite",
    label: "Socialite",
    description: "Complete 25 social actions.",
    check: ({ progress }) => Boolean(progress && progress.lifetime?.socialActions >= 25),
  },
  {
    id: "caretaker",
    label: "Caretaker",
    description: "Complete 120 care actions.",
    check: ({ progress }) => Boolean(progress && progress.lifetime?.careActions >= 120),
  },
  {
    id: "collector",
    label: "Collector",
    description: "Hold 6 unique item types.",
    check: ({ economy }) => {
      if (!economy) {
        return false;
      }

      let uniqueCount = 0;
      for (const [, count] of economy.inventory.entries()) {
        if ((Number(count) || 0) > 0) {
          uniqueCount += 1;
        }
      }

      return uniqueCount >= 6;
    },
  },
  {
    id: "wayfarer",
    label: "Wayfarer",
    description: "Finish 10 adventures.",
    check: ({ progress }) =>
      Boolean(progress && progress.lifetime?.adventuresCompleted >= 10),
  },
  {
    id: "benefactor",
    label: "Benefactor",
    description: "Gift 500+ Star Coins or 20+ items.",
    check: ({ progress }) =>
      Boolean(
        progress &&
          ((progress.lifetime?.coinsGifted || 0) >= 500 ||
            (progress.lifetime?.itemsGifted || 0) >= 20)
      ),
  },
  {
    id: "mortuary-assistant",
    label: "Mortuary Assistant",
    description: "Revive your Kiby at least once.",
    check: ({ progress }) => Boolean(progress && progress.revive?.totalRevives >= 1),
  },
];

function getTitleDefinition(id) {
  return TITLE_DEFINITIONS.find((title) => title.id === id);
}

function getTitleLabelById(id) {
  const definition = getTitleDefinition(id);
  return definition ? definition.label : "";
}

function serializeTitle(definition, unlocked, equipped) {
  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    unlocked,
    equipped: unlocked && definition.id === equipped,
  };
}

async function ensureTitlesForUser(userId, now = new Date()) {
  const [player, economy, progressResult] = await Promise.all([
    playerRepository.findByUserId(userId),
    economyService.ensureEconomy(userId),
    progressionService.ensureProgress(userId, now),
  ]);
  const progress = progressResult.progress;

  progress.titles = progress.titles || {};
  progress.titles.unlocked = Array.isArray(progress.titles.unlocked)
    ? progress.titles.unlocked
    : [];
  progress.titles.equipped = progress.titles.equipped || "";

  let changed = false;
  const newlyUnlocked = [];

  for (const definition of TITLE_DEFINITIONS) {
    const unlocked = progress.titles.unlocked.includes(definition.id);
    if (unlocked) {
      continue;
    }

    if (definition.check({ player, progress, economy })) {
      progress.titles.unlocked.push(definition.id);
      newlyUnlocked.push(definition.id);
      changed = true;
    }
  }

  if (
    !progress.titles.equipped &&
    progress.titles.unlocked.length > 0
  ) {
    progress.titles.equipped = progress.titles.unlocked[0];
    changed = true;
  }

  if (
    progress.titles.equipped &&
    !progress.titles.unlocked.includes(progress.titles.equipped)
  ) {
    progress.titles.equipped = "";
    changed = true;
  }

  if (changed) {
    await playerProgressRepository.saveProgress(progress);
  }

  return {
    unlocked: progress.titles.unlocked,
    equipped: progress.titles.equipped,
    newlyUnlocked,
    catalog: TITLE_DEFINITIONS.map((definition) =>
      serializeTitle(
        definition,
        progress.titles.unlocked.includes(definition.id),
        progress.titles.equipped
      )
    ),
  };
}

async function equipTitle(userId, titleId, now = new Date()) {
  const state = await ensureTitlesForUser(userId, now);
  if (!state.unlocked.includes(titleId)) {
    return {
      ok: false,
      reason: "locked-title",
      state,
    };
  }

  const progressResult = await progressionService.ensureProgress(userId, now);
  const progress = progressResult.progress;
  progress.titles.equipped = titleId;
  await playerProgressRepository.saveProgress(progress);

  return {
    ok: true,
    titleId,
    titleLabel: getTitleLabelById(titleId),
    state: {
      ...state,
      equipped: titleId,
    },
  };
}

async function getEquippedTitleMap(userIds = []) {
  if (!userIds.length) {
    return new Map();
  }

  const progresses = await playerProgressRepository.listByUserIds(userIds);
  const map = new Map();
  for (const progress of progresses) {
    const titleId = progress.titles?.equipped || "";
    if (!titleId) {
      continue;
    }

    map.set(progress.userId, {
      id: titleId,
      label: getTitleLabelById(titleId),
    });
  }

  return map;
}

module.exports = {
  TITLE_DEFINITIONS,
  ensureTitlesForUser,
  equipTitle,
  getEquippedTitleMap,
  getTitleDefinition,
  getTitleLabelById,
};
