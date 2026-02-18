const env = require("../config/env");
const progressionService = require("./progressionService");
const playerProgressRepository = require("../repositories/playerProgressRepository");

const LEXICON = {
  poyo: "hello",
  kibi: "kiby",
  luma: "star",
  dori: "play",
  mimi: "food",
  sana: "sleep",
  nuzu: "cuddle",
  rali: "train",
  vella: "care",
  tumi: "hurt",
  zoru: "danger",
  yara: "thank you",
  sofi: "together",
  kira: "adventure",
  ombi: "home",
  nari: "friend",
  cavo: "ready",
  rumi: "calm",
  jori: "joy",
  vexa: "worry",
};

const CONVERSATION_LINES = {
  Joyful: [
    ["poyo", "jori", "luma"],
    ["kibi", "jori", "dori"],
    ["poyo", "nari", "sofi"],
  ],
  Calm: [
    ["rumi", "poyo", "vella"],
    ["kibi", "rumi", "ombi"],
    ["poyo", "sana", "rumi"],
  ],
  Hungry: [
    ["mimi", "mimi", "poyo"],
    ["kibi", "mimi", "vexa"],
    ["nari", "mimi", "yara"],
  ],
  Lonely: [
    ["nari", "sofi", "dori"],
    ["kibi", "sofi", "poyo"],
    ["poyo", "nari", "vella"],
  ],
  Sleepy: [
    ["sana", "sana", "rumi"],
    ["kibi", "sana", "ombi"],
    ["poyo", "sana", "luma"],
  ],
  "Worn Out": [
    ["tumi", "vella", "poyo"],
    ["kibi", "rumi", "vella"],
    ["zoru", "tumi", "vella"],
  ],
  Exhausted: [
    ["tumi", "tumi", "vella"],
    ["zoru", "vella", "sana"],
    ["kibi", "tumi", "ombi"],
  ],
  Unknown: [["poyo", "kibi"]],
};

const ACTION_TAGS = {
  feed: ["mimi", "yara"],
  pet: ["vella", "rumi"],
  play: ["dori", "jori"],
  cuddle: ["nuzu", "rumi"],
  train: ["rali", "cavo"],
  bathe: ["vella", "rumi"],
  socialPlay: ["nari", "sofi"],
};

const AMBIENT_LINES = {
  Joyful: [
    ["kibi", "jori", "dori"],
    ["poyo", "luma", "jori"],
    ["kibi", "nuzu", "sofi"],
  ],
  Calm: [
    ["rumi", "ombi", "poyo"],
    ["kibi", "rumi", "vella"],
    ["sana", "rumi", "ombi"],
  ],
  Hungry: [
    ["mimi", "vexa", "kibi"],
    ["mimi", "poyo", "yara"],
    ["kibi", "mimi", "ombi"],
  ],
  Lonely: [
    ["nari", "dori", "sofi"],
    ["poyo", "nari", "kibi"],
    ["kibi", "sofi", "vella"],
  ],
  Sleepy: [
    ["sana", "rumi", "kibi"],
    ["sana", "ombi", "luma"],
    ["poyo", "sana", "sana"],
  ],
  "Worn Out": [
    ["tumi", "rumi", "vella"],
    ["kibi", "tumi", "ombi"],
    ["vella", "sana", "rumi"],
  ],
  Exhausted: [
    ["tumi", "zoru", "vella"],
    ["kibi", "tumi", "sana"],
    ["ombi", "sana", "vella"],
  ],
  Unknown: [["poyo", "kibi"]],
};

const ADVENTURE_LINES = {
  start: [
    ["kira", "cavo", "poyo"],
    ["kibi", "kira", "luma"],
    ["zoru", "kira", "cavo"],
  ],
  status: [
    ["kira", "rumi", "cavo"],
    ["kibi", "kira", "vella"],
    ["zoru", "kira", "vexa"],
  ],
  success: [
    ["kira", "jori", "yara"],
    ["luma", "kira", "sofi"],
    ["kibi", "cavo", "jori"],
  ],
  failed: [
    ["kira", "tumi", "ombi"],
    ["zoru", "kira", "vella"],
    ["kibi", "tumi", "sana"],
  ],
};

const EVENT_LINES = {
  world: [
    ["luma", "vexa", "kibi"],
    ["nari", "vella", "luma"],
    ["poyo", "zoru", "vella"],
  ],
  global: [
    ["sofi", "luma", "jori"],
    ["nari", "sofi", "kira"],
    ["poyo", "luma", "yara"],
  ],
};

function pickRandom(list = []) {
  if (!list.length) {
    return [];
  }
  return list[Math.floor(Math.random() * list.length)];
}

function ensureLanguageState(progress) {
  progress.language = progress.language || {};
  progress.language.xp = Number(progress.language.xp) || 0;
  progress.language.level = Math.max(1, Number(progress.language.level) || 1);

  const rawDiscovered = progress.language.discovered;
  if (!rawDiscovered || typeof rawDiscovered.get !== "function") {
    progress.language.discovered = new Map(Object.entries(rawDiscovered || {}));
  }

  const rawExposure = progress.language.exposure;
  if (!rawExposure || typeof rawExposure.get !== "function") {
    progress.language.exposure = new Map(Object.entries(rawExposure || {}));
  }
}

async function renderTokensForUser(userId, tokens = [], now = new Date()) {
  const progressResult = await progressionService.ensureProgress(userId, now);
  const progress = progressResult.progress;
  ensureLanguageState(progress);

  let gainedXp = 0;
  const discovered = progress.language.discovered;
  const exposure = progress.language.exposure;
  for (const token of tokens) {
    if (!LEXICON[token]) {
      continue;
    }

    const seen = (Number(exposure.get(token)) || 0) + 1;
    exposure.set(token, seen);
    if (!discovered.get(token) && seen >= env.languageExposurePerUnlock) {
      discovered.set(token, LEXICON[token]);
    }

    gainedXp += env.languageXpPerExposure;
  }

  if (gainedXp > 0) {
    progress.language.xp += gainedXp;
    progress.language.level = Math.max(
      1,
      Math.floor(progress.language.xp / env.languageXpPerLevel) + 1
    );
  }

  await playerProgressRepository.saveProgress(progress);

  return tokens
    .map((token) => {
      const translation = discovered.get(token);
      return translation ? `${token}(${translation})` : token;
    })
    .join(" ");
}

function getMostRecentAction(lastCare = {}) {
  const entries = Object.entries(lastCare)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({
      key,
      at: new Date(value).getTime(),
    }))
    .sort((a, b) => b.at - a.at);

  return entries[0]?.key || "";
}

async function buildConversationLineForUser(
  userId,
  profile,
  mood,
  now = new Date(),
  recentAction = ""
) {
  const base = pickRandom(CONVERSATION_LINES[mood] || CONVERSATION_LINES.Unknown);
  const actionKey = recentAction || getMostRecentAction(profile.lastCare || {});
  const actionTokens = ACTION_TAGS[actionKey] || [];
  return renderTokensForUser(userId, [...base, ...actionTokens], now);
}

async function buildAmbientLineForUser(userId, mood, now = new Date()) {
  const base = pickRandom(AMBIENT_LINES[mood] || AMBIENT_LINES.Unknown);
  return renderTokensForUser(userId, base, now);
}

async function buildAdventureLineForUser(userId, phase = "start", now = new Date()) {
  const base = pickRandom(ADVENTURE_LINES[phase] || ADVENTURE_LINES.start);
  return renderTokensForUser(userId, base, now);
}

async function buildWorldEventLineForUser(userId, now = new Date()) {
  return renderTokensForUser(userId, pickRandom(EVENT_LINES.world), now);
}

async function buildGlobalEventLineForUser(userId, now = new Date()) {
  return renderTokensForUser(userId, pickRandom(EVENT_LINES.global), now);
}

async function getLanguageStatus(userId, now = new Date()) {
  const progressResult = await progressionService.ensureProgress(userId, now);
  const progress = progressResult.progress;
  ensureLanguageState(progress);

  const discoveredEntries = Array.from(progress.language.discovered.entries());
  const discoveredCount = discoveredEntries.length;
  const totalTerms = Object.keys(LEXICON).length;
  const unknownCount = Math.max(0, totalTerms - discoveredCount);

  return {
    xp: progress.language.xp,
    level: progress.language.level,
    discoveredCount,
    totalTerms,
    unknownCount,
    glossarySample: discoveredEntries.slice(0, 8).map(([token, translation]) => ({
      token,
      translation,
    })),
  };
}

module.exports = {
  LEXICON,
  buildAdventureLineForUser,
  buildAmbientLineForUser,
  buildConversationLineForUser,
  buildGlobalEventLineForUser,
  buildWorldEventLineForUser,
  getLanguageStatus,
  getMostRecentAction,
};
