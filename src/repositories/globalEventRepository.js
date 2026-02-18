const GlobalEventState = require("../schemas/globalEventState");

async function findActive(now = new Date()) {
  return GlobalEventState.findOne({
    startedAt: { $lte: now },
    endsAt: { $gt: now },
  }).sort({ startedAt: -1 });
}

async function findLatest() {
  return GlobalEventState.findOne({}).sort({ startedAt: -1 });
}

async function findByEventId(eventId) {
  return GlobalEventState.findOne({ eventId });
}

async function findLatestCompletedUnannounced() {
  return GlobalEventState.findOne({
    completedAt: { $ne: null },
    announcedCompletion: false,
  }).sort({ completedAt: -1 });
}

async function createEvent(payload) {
  const event = new GlobalEventState(payload);
  return event.save();
}

async function saveEvent(event) {
  return event.save();
}

module.exports = {
  createEvent,
  findActive,
  findByEventId,
  findLatestCompletedUnannounced,
  findLatest,
  saveEvent,
};
