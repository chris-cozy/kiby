const { evaluateMood } = require("../domain/mood/evaluateMood");

const MOOD_DIALOGUE = {
  Joyful: [
    "Poyo! I feel amazing today!",
    "My stars are shining bright!",
    "Let's keep this happy streak going!",
  ],
  Calm: [
    "Poyo... just vibing in Dream Land.",
    "I'm doing okay. Want to hang out?",
    "Steady and cozy is my style today.",
  ],
  Hungry: [
    "Poyo... I could really use a snack.",
    "My tummy is rumbling in star rhythm.",
    "Food would make this day much better!",
  ],
  Lonely: [
    "I want more playtime with friends.",
    "Can we spend some time together soon?",
    "I miss the warm social spark.",
  ],
  Sleepy: [
    "Soft poyo... bedtime mode.",
    "I'm resting and dreaming of stars.",
    "Shh... sleep schedule activated.",
  ],
  "Worn Out": [
    "That was a lot. I need recovery time.",
    "I can keep going, but I need care.",
    "I'm tired, but still trying my best.",
  ],
  Exhausted: [
    "Everything feels heavy right now.",
    "Please help me recover soon...",
    "I need serious rest and care.",
  ],
  Unknown: ["Poyo?"],
};

const RECENT_ACTION_TAGS = {
  feed: "Thanks for the meal!",
  pet: "Your kindness feels nice.",
  play: "That play session was fun!",
  cuddle: "I feel super cozy now.",
  train: "Training made me stronger!",
  bathe: "Fresh and sparkly!",
  socialPlay: "Social time was great!",
};

const AMBIENT_BEHAVIORS = {
  Joyful: [
    "nuzzles your hand with a huge smile.",
    "twirls in place and beams at you.",
    "hums happily and bounces twice.",
  ],
  Calm: [
    "rests beside you and looks content.",
    "gives you a gentle, quiet stare.",
    "takes a deep breath and settles in.",
  ],
  Hungry: [
    "stares at you with hopeful eyes.",
    "pats their belly and tilts their head.",
    "walks toward the food bowl slowly.",
  ],
  Lonely: [
    "leans in close, wanting attention.",
    "sits nearby and waits for interaction.",
    "looks around for a play buddy.",
  ],
  Sleepy: [
    "yawns softly and curls up.",
    "blinks slowly, half-asleep.",
    "snuggles into a quiet corner.",
  ],
  "Worn Out": [
    "takes a careful breath and stays near you.",
    "moves slowly, asking for comfort.",
    "looks tired but still determined.",
  ],
  Exhausted: [
    "barely lifts their head and sighs.",
    "shivers slightly and looks drained.",
    "leans on you for support.",
  ],
  Unknown: ["looks around curiously."],
};

function pickRandom(list = []) {
  if (!list.length) {
    return "";
  }

  return list[Math.floor(Math.random() * list.length)];
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

function buildConversationLine(profile, options = {}) {
  const mood = options.mood || evaluateMood(profile, { sleeping: options.sleeping });
  const moodLine = pickRandom(MOOD_DIALOGUE[mood] || MOOD_DIALOGUE.Unknown);
  const recentAction = options.recentAction || getMostRecentAction(profile.lastCare || {});
  const actionLine = RECENT_ACTION_TAGS[recentAction] || "";

  if (!actionLine) {
    return moodLine;
  }

  return `${moodLine} ${actionLine}`;
}

function buildAmbientBehavior(profile, options = {}) {
  const mood = options.mood || evaluateMood(profile, { sleeping: options.sleeping });
  const phrase = pickRandom(AMBIENT_BEHAVIORS[mood] || AMBIENT_BEHAVIORS.Unknown);
  return {
    mood,
    phrase,
  };
}

module.exports = {
  buildAmbientBehavior,
  buildConversationLine,
  evaluateMood,
  getMostRecentAction,
};
