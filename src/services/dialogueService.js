const { evaluateMood } = require("../domain/mood/evaluateMood");
const languageService = require("./languageService");

async function buildConversationLine(userId, profile, options = {}, now = new Date()) {
  const mood = options.mood || evaluateMood(profile, { sleeping: options.sleeping });
  return languageService.buildConversationLineForUser(
    userId,
    profile,
    mood,
    now,
    options.recentAction
  );
}

async function buildAmbientBehavior(userId, profile, options = {}, now = new Date()) {
  const mood = options.mood || evaluateMood(profile, { sleeping: options.sleeping });
  const phrase = await languageService.buildAmbientLineForUser(userId, mood, now);
  return {
    mood,
    phrase,
  };
}

module.exports = {
  buildAmbientBehavior,
  buildConversationLine,
  evaluateMood,
  getMostRecentAction: languageService.getMostRecentAction,
};
