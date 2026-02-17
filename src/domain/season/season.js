const SEASON_ANCHOR_UTC = Date.UTC(2026, 0, 1, 0, 0, 0, 0);

function getSeasonContext(now = new Date(), seasonLengthDays = 7) {
  const safeLength = seasonLengthDays === 14 ? 14 : 7;
  const seasonLengthMs = safeLength * 24 * 60 * 60 * 1000;
  const elapsed = now.getTime() - SEASON_ANCHOR_UTC;
  const index = Math.max(0, Math.floor(elapsed / seasonLengthMs));
  const startAt = new Date(SEASON_ANCHOR_UTC + index * seasonLengthMs);
  const endAt = new Date(startAt.getTime() + seasonLengthMs);

  return {
    key: `${startAt.toISOString().slice(0, 10)}:${safeLength}d`,
    index,
    startAt,
    endAt,
    seasonLengthDays: safeLength,
  };
}

module.exports = {
  getSeasonContext,
};
