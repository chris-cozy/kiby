const { EVENTS } = require("../domain/events/worldEvents");
const playerRepository = require("../repositories/playerRepository");

const DEFAULT_EVENT_CHANCE = 0.08;

function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

async function runWorldEventTick(now = new Date(), eventChance = DEFAULT_EVENT_CHANCE) {
  const players = await playerRepository.listAllPlayers();
  if (!players.length) {
    return {
      triggered: false,
      reason: "no-players",
    };
  }

  if (Math.random() > eventChance) {
    return {
      triggered: false,
      reason: "chance-miss",
    };
  }

  const target = players[randomInt(players.length)];
  const event = EVENTS[randomInt(EVENTS.length)];
  const delta = event.apply(target);

  await playerRepository.savePlayer(target);

  return {
    triggered: true,
    userId: target.userId,
    kirbyName: target.kirbyName,
    event: {
      key: event.key,
      title: event.title,
      description: event.description,
    },
    delta,
    occurredAt: now,
  };
}

module.exports = {
  runWorldEventTick,
};
