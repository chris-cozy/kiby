function calculateXpForLevel(level) {
  const safeLevel = Math.max(1, Number(level) || 1);
  const x = 0.3;
  const y = 2;
  return Math.round((safeLevel / x) ** y);
}

function applyLevelProgression(level, xp) {
  let currentLevel = Math.max(1, Number(level) || 1);
  let currentXp = Math.max(0, Number(xp) || 0);
  let leveledUp = false;

  while (currentXp >= calculateXpForLevel(currentLevel)) {
    currentXp -= calculateXpForLevel(currentLevel);
    currentLevel += 1;
    leveledUp = true;
  }

  return {
    level: currentLevel,
    xp: currentXp,
    leveledUp,
  };
}

module.exports = {
  calculateXpForLevel,
  applyLevelProgression,
};
