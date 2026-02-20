function evaluateMood(profile, options = {}) {
  const sleeping = Boolean(options.sleeping);

  if (!profile) {
    return "Unknown";
  }

  if ((profile.hp || 0) <= 20) {
    return "Exhausted";
  }

  if ((profile.hunger || 0) <= 25) {
    return "Hungry";
  }

  if ((profile.affection || 0) <= 25 || (profile.social || 0) <= 25) {
    return "Lonely";
  }

  if (sleeping) {
    return "Sleepy";
  }

  if (
    (profile.hp || 0) >= 85 &&
    (profile.hunger || 0) >= 70 &&
    (profile.affection || 0) >= 70 &&
    (profile.social || 0) >= 70
  ) {
    return "Joyful";
  }

  if ((profile.hp || 0) < 45) {
    return "Worn Out";
  }

  return "Calm";
}

module.exports = {
  evaluateMood,
};
