const env = require("../config/env");

const MAX_BATTLE_POWER = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function clampBattlePower(value) {
  return Math.max(0, Math.min(MAX_BATTLE_POWER, Math.round(value || 0)));
}

function randomInt(min, max) {
  const safeMin = Math.ceil(min);
  const safeMax = Math.floor(max);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

function applyLazyDecay(profile, now = new Date(), options = {}) {
  const touch = options.touch !== false;
  const currentPower = clampBattlePower(profile.battlePower || 0);
  const nowMs = now.getTime();
  const lastTouchedMs = profile.battlePowerUpdatedAt
    ? new Date(profile.battlePowerUpdatedAt).getTime()
    : nowMs;
  const elapsedMs = Math.max(0, nowMs - lastTouchedMs);
  const decayRate = Math.max(0, env.battlePowerDecayPercentPerDay / 100);

  let nextPower = currentPower;
  if (decayRate > 0 && elapsedMs > 0) {
    const elapsedDays = elapsedMs / DAY_MS;
    nextPower = clampBattlePower(
      currentPower * Math.pow(1 - decayRate, elapsedDays)
    );
  }

  const decayed = Math.max(0, currentPower - nextPower);
  profile.battlePower = nextPower;
  if (touch || decayed > 0 || !profile.battlePowerUpdatedAt) {
    profile.battlePowerUpdatedAt = now;
  }

  return {
    battlePower: nextPower,
    decayed,
    elapsedMs,
  };
}

function applyTrainingGain(profile, now = new Date(), rng = randomInt) {
  const decayResult = applyLazyDecay(profile, now, { touch: false });
  const before = clampBattlePower(profile.battlePower || 0);
  const rolled = rng(env.battlePowerTrainMinGain, env.battlePowerTrainMaxGain);
  profile.battlePower = clampBattlePower(before + rolled);
  profile.battlePowerUpdatedAt = now;

  return {
    decayed: decayResult.decayed,
    gain: profile.battlePower - before,
    battlePower: profile.battlePower,
  };
}

module.exports = {
  MAX_BATTLE_POWER,
  applyLazyDecay,
  applyTrainingGain,
  clampBattlePower,
};
