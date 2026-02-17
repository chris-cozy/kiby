function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function normalizeTimeZone(timeZone) {
  if (!timeZone || !isValidTimeZone(timeZone)) {
    return "UTC";
  }

  return timeZone;
}

function getDayKeyInTimeZone(date = new Date(), timeZone = "UTC") {
  const safeTimeZone = normalizeTimeZone(timeZone);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

function getYesterdayDayKeyInTimeZone(date = new Date(), timeZone = "UTC") {
  const previousDay = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  return getDayKeyInTimeZone(previousDay, timeZone);
}

function getSecondsUntilLocalMidnight(date = new Date(), timeZone = "UTC") {
  const safeTimeZone = normalizeTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const hour = Number.parseInt(parts.find((part) => part.type === "hour")?.value || "0", 10);
  const minute = Number.parseInt(
    parts.find((part) => part.type === "minute")?.value || "0",
    10
  );
  const second = Number.parseInt(
    parts.find((part) => part.type === "second")?.value || "0",
    10
  );

  return (24 * 60 * 60) - (hour * 3600 + minute * 60 + second);
}

module.exports = {
  getDayKeyInTimeZone,
  getSecondsUntilLocalMidnight,
  getYesterdayDayKeyInTimeZone,
  normalizeTimeZone,
};
