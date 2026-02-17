const env = require("../config/env");
const npcRepository = require("../repositories/npcRepository");
const deathHistoryRepository = require("../repositories/deathHistoryRepository");
const { simulateNpcTick } = require("../domain/npc/simulator");
const seasonService = require("./seasonService");

const NAME_POOL = [
  "Nova", "Skipper", "Mallow", "Puffin", "Waddle", "Sprout", "Orbit", "Biscuit",
  "Marble", "Rookie", "Comet", "Pebble", "Floss", "Twinkle", "Bramble", "Poppy",
  "Noodle", "Doodle", "Sora", "Koko", "Jelly", "Berry", "Miso", "Pico",
  "Cloud", "Sunny", "Mochi", "Pixel", "Bubbles", "Fable", "Echo", "Juniper",
  "Minty", "Cosmo", "Rascal", "Pudding", "Rollo", "Clover", "Nimbus", "Tinsel",
  "Toffee", "Whisk", "Pogo", "Ripple", "Benny", "Lumen", "Spark", "Merry",
];

const KIRBY_NAME_POOL = [
  "Starry", "Poyo", "Nibbles", "Comet", "Sprinkles", "Boop", "Bop", "Mochi",
  "Bubble", "Puff", "Wisp", "Biscuit", "Twirl", "Jellybean", "Coco", "Pip",
  "Nimbus", "Pebble", "Button", "Sunny", "Dandy", "Taffy", "Berry", "Orbit",
  "Mallow", "Bubbles", "Waddle", "Spark", "Merry", "Flare", "Moon", "Nova",
];

function generateKirbyName(displayName, index) {
  const nickname = KIRBY_NAME_POOL[(index * 7) % KIRBY_NAME_POOL.length];
  const pattern = index % 5;

  if (pattern === 0) {
    return displayName;
  }

  if (pattern === 1) {
    return nickname;
  }

  if (pattern === 2) {
    return `${nickname} Puff`;
  }

  if (pattern === 3) {
    return `${displayName} ${nickname}`;
  }

  return `${nickname} Jr`;
}

function buildNpcSeedData() {
  const rows = [];
  const tiers = [
    ["casual", env.npcCasual, "laid-back caretaker"],
    ["active", env.npcActive, "consistent caregiver"],
    ["competitive", env.npcCompetitive, "high-grind trainer"],
  ];

  let index = 0;
  for (const [tier, count, style] of tiers) {
    for (let i = 0; i < count; i += 1) {
      const name = NAME_POOL[index % NAME_POOL.length];
      const suffix = Math.floor(index / NAME_POOL.length) + 1;
      const display = suffix > 1 ? `${name}${suffix}` : name;
      const now = new Date();

      rows.push({
        npcId: `npc-${String(index + 1).padStart(3, "0")}`,
        displayName: display,
        kirbyName: generateKirbyName(display, index),
        tier,
        careStyle: style,
        behaviorSeed: (index + 1) * 971,
        level: tier === "competitive" ? 4 : tier === "active" ? 2 : 1,
        xp: 0,
        hp: 100,
        hunger: tier === "competitive" ? 95 : 90,
        affection: tier === "competitive" ? 95 : 90,
        social: tier === "competitive" ? 95 : 90,
        adoptedAt: now,
        lastSimulatedAt: now,
        lastCare: {
          feed: now,
          pet: now,
          play: now,
          cuddle: now,
          train: now,
          bathe: now,
          socialPlay: now,
        },
      });

      index += 1;
    }
  }

  return rows;
}

async function ensureNpcSeeded() {
  if (!env.npcEnabled) {
    return {
      seeded: false,
      reason: "disabled",
    };
  }

  const existingCount = await npcRepository.countAll();
  if (existingCount > 0) {
    return {
      seeded: false,
      reason: "already-seeded",
      count: existingCount,
    };
  }

  const payload = buildNpcSeedData();
  await npcRepository.createMany(payload);

  return {
    seeded: true,
    count: payload.length,
  };
}

async function resetNpcSeed() {
  if (!env.npcEnabled) {
    return {
      reset: false,
      reason: "disabled",
    };
  }

  await npcRepository.deleteAll();
  const payload = buildNpcSeedData();
  await npcRepository.createMany(payload);

  return {
    reset: true,
    count: payload.length,
  };
}

async function runNpcTick(now = new Date()) {
  if (!env.npcEnabled) {
    return {
      npcCount: 0,
      deaths: 0,
    };
  }

  const npcs = await npcRepository.listAll();
  let deaths = 0;

  for (const npc of npcs) {
    const simulation = simulateNpcTick(npc, {
      now,
      neglectThresholdMs: env.neglectThresholdMinutes * 60 * 1000,
    });

    if (simulation.totalXpGranted > 0) {
      await seasonService.recordEntityProgress(
        "npc",
        npc.npcId,
        npc.kirbyName,
        simulation.totalXpGranted,
        now
      );
    }

    if (simulation.died) {
      deaths += 1;
      await deathHistoryRepository.createDeathRecord({
        entityType: "npc",
        npcId: npc.npcId,
        kirbyName: npc.kirbyName,
        level: npc.level,
        adoptedAt: npc.adoptedAt,
        deathAt: now,
        reason: "npc-neglect",
      });
    }

    await npcRepository.saveNpc(npc);
  }

  return {
    npcCount: npcs.length,
    deaths,
  };
}

module.exports = {
  ensureNpcSeeded,
  generateKirbyName,
  resetNpcSeed,
  runNpcTick,
};
