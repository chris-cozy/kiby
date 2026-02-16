function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function parseLocalTime(localTime) {
  const match = /^(\d{2}):(\d{2})$/.exec(localTime || "");
  if (!match) {
    throw new Error("Time must match HH:mm.");
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (hour > 23 || minute > 59) {
    throw new Error("Time must be in 24-hour format.");
  }

  return hour * 60 + minute;
}

function formatMinuteOfDay(minuteOfDay) {
  const normalized = ((minuteOfDay % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const minute = (normalized % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

function getLocalMinuteOfDay(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const hour = Number.parseInt(
    parts.find((part) => part.type === "hour").value,
    10
  );
  const minute = Number.parseInt(
    parts.find((part) => part.type === "minute").value,
    10
  );

  return hour * 60 + minute;
}

function isInSleepWindow(date, schedule) {
  if (!schedule || !schedule.enabled) {
    return false;
  }

  const start = schedule.startMinuteLocal;
  const duration = schedule.durationMinutes;

  if (duration <= 0) {
    return false;
  }

  if (duration >= 1440) {
    return true;
  }

  const localMinute = getLocalMinuteOfDay(date, schedule.timezone);
  const end = (start + duration) % 1440;

  if (start < end) {
    return localMinute >= start && localMinute < end;
  }

  return localMinute >= start || localMinute < end;
}

function getRemainingSleepMs(date, schedule) {
  if (!isInSleepWindow(date, schedule)) {
    return 0;
  }

  const localMinute = getLocalMinuteOfDay(date, schedule.timezone);
  const elapsed = (localMinute - schedule.startMinuteLocal + 1440) % 1440;
  const remainingMinutes = Math.max(0, schedule.durationMinutes - elapsed);

  return remainingMinutes * 60 * 1000;
}

module.exports = {
  formatMinuteOfDay,
  getLocalMinuteOfDay,
  getRemainingSleepMs,
  isInSleepWindow,
  isValidTimeZone,
  parseLocalTime,
};
