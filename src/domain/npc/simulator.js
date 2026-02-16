const { applyCareAction, applyDecay } = require("../care/rules");

const TIER_BEHAVIORS = {
  casual: {
    feedChance: 0.35,
    petChance: 0.35,
    playChance: 0.2,
    passiveDecay: 2,
  },
  active: {
    feedChance: 0.55,
    petChance: 0.55,
    playChance: 0.4,
    passiveDecay: 1,
  },
  competitive: {
    feedChance: 0.8,
    petChance: 0.8,
    playChance: 0.7,
    passiveDecay: 0,
  },
};

function nextRandom(seed) {
  const nextSeed = (seed * 1664525 + 1013904223) >>> 0;
  return {
    seed: nextSeed,
    value: nextSeed / 4294967296,
  };
}

function createSeededRandom(seed) {
  let current = seed >>> 0;

  return {
    random() {
      const generated = nextRandom(current);
      current = generated.seed;
      return generated.value;
    },
    randomInt(min, max) {
      const value = this.random();
      const floor = Math.ceil(min);
      const ceiling = Math.floor(max);
      return Math.floor(value * (ceiling - floor + 1)) + floor;
    },
    getSeed() {
      return current;
    },
  };
}

function simulateNpcTick(npcProfile, options = {}) {
  const now = options.now || new Date();
  const neglectThresholdMs = options.neglectThresholdMs || 60 * 60 * 1000;
  const rng = createSeededRandom(npcProfile.behaviorSeed || 1);
  const behavior = TIER_BEHAVIORS[npcProfile.tier] || TIER_BEHAVIORS.casual;

  const actions = [];

  if (rng.random() < behavior.feedChance) {
    const result = applyCareAction(npcProfile, "feed", now, rng.randomInt.bind(rng));
    if (result.ok) actions.push("feed");
  }

  if (rng.random() < behavior.petChance) {
    const result = applyCareAction(npcProfile, "pet", now, rng.randomInt.bind(rng));
    if (result.ok) actions.push("pet");
  }

  if (rng.random() < behavior.playChance) {
    const result = applyCareAction(npcProfile, "play", now, rng.randomInt.bind(rng));
    if (result.ok) actions.push("play");
  }

  if (actions.length === 0 && behavior.passiveDecay > 0) {
    npcProfile.hunger = Math.max(0, npcProfile.hunger - behavior.passiveDecay);
    npcProfile.affection = Math.max(0, npcProfile.affection - behavior.passiveDecay);
  }

  const decayResult = applyDecay(npcProfile, {
    now,
    rng: rng.randomInt.bind(rng),
    neglectThresholdMs,
    notificationThreshold: 30,
  });

  if (decayResult.events.died) {
    npcProfile.level = Math.max(1, npcProfile.level - 1);
    npcProfile.xp = 0;
    npcProfile.hp = 100;
    npcProfile.hunger = 90;
    npcProfile.affection = 90;
    npcProfile.adoptedAt = now;
  }

  npcProfile.behaviorSeed = rng.getSeed();
  npcProfile.lastSimulatedAt = now;

  return {
    actions,
    died: decayResult.events.died,
    seed: npcProfile.behaviorSeed,
  };
}

module.exports = {
  TIER_BEHAVIORS,
  createSeededRandom,
  simulateNpcTick,
};
