function normalizeToken(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const GLOBAL_EVENT_MEDIA_BY_KEY = Object.freeze({
  "dream-orchard": "global_events/dream_orchard_festival",
  "star-rail-rally": "global_events/star_rail_rally",
  "lunar-lullaby": "global_events/lunar_lullaby_watch",
});

function resolveGlobalEventMediaKey(event = {}) {
  if (event.key && GLOBAL_EVENT_MEDIA_BY_KEY[event.key]) {
    return GLOBAL_EVENT_MEDIA_BY_KEY[event.key];
  }

  const titleToken = normalizeToken(event.title);
  if (titleToken) {
    return `global_events/${titleToken}`;
  }

  const keyToken = normalizeToken(event.key);
  if (keyToken) {
    return `global_events/${keyToken}`;
  }

  return "info";
}

function resolveWorldEventMediaKey(event = {}) {
  const keyToken = normalizeToken(event.key);
  if (keyToken) {
    return `world_events/${keyToken}`;
  }

  const titleToken = normalizeToken(event.title);
  if (titleToken) {
    return `world_events/${titleToken}`;
  }

  return "info";
}

module.exports = {
  resolveGlobalEventMediaKey,
  resolveWorldEventMediaKey,
};
