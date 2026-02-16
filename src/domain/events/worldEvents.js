const EVENTS = [
  {
    key: "dream-feast",
    title: "Dream Feast",
    description: "A feast appears in Dream Land.",
    apply(profile) {
      const before = profile.hunger;
      profile.hunger = Math.min(100, profile.hunger + 12);
      return {
        hunger: profile.hunger - before,
      };
    },
  },
  {
    key: "star-parade",
    title: "Star Parade",
    description: "A star parade boosts your Kiby's mood.",
    apply(profile) {
      const before = profile.affection;
      profile.affection = Math.min(100, profile.affection + 12);
      return {
        affection: profile.affection - before,
      };
    },
  },
  {
    key: "nightmare-cloud",
    title: "Nightmare Cloud",
    description: "A nightmare cloud causes stress.",
    apply(profile) {
      const before = profile.affection;
      profile.affection = Math.max(0, profile.affection - 8);
      return {
        affection: profile.affection - before,
      };
    },
  },
  {
    key: "healing-song",
    title: "Healing Song",
    description: "A healing song restores energy.",
    apply(profile) {
      const before = profile.hp;
      profile.hp = Math.min(100, profile.hp + 8);
      return {
        hp: profile.hp - before,
      };
    },
  },
];

module.exports = {
  EVENTS,
};
