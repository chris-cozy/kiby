const env = require("../config/env");
const sleepScheduleRepository = require("../repositories/sleepScheduleRepository");
const {
  formatMinuteOfDay,
  getRemainingSleepMs,
  isInSleepWindow,
  isValidTimeZone,
  parseLocalTime,
} = require("../domain/sleep/schedule");

function getDefaultSchedulePayload() {
  return {
    timezone: env.defaultSleepTimeZone,
    startMinuteLocal: env.defaultSleepStartMinute,
    durationMinutes: env.defaultSleepDurationHours * 60,
    enabled: true,
  };
}

async function getScheduleForUser(userId) {
  let schedule = await sleepScheduleRepository.findByUserId(userId);
  if (!schedule) {
    schedule = await sleepScheduleRepository.upsertByUserId(
      userId,
      getDefaultSchedulePayload()
    );
  }

  return schedule;
}

async function setScheduleForUser(userId, options) {
  const timezone = options.timezone;
  if (!isValidTimeZone(timezone)) {
    throw new Error("Timezone must be a valid IANA identifier.");
  }

  const startMinuteLocal = parseLocalTime(options.startLocalTime);
  const durationHours = Number.parseInt(options.durationHours, 10);

  if (Number.isNaN(durationHours) || durationHours < 1 || durationHours > 9) {
    throw new Error("Duration must be between 1 and 9 hours.");
  }

  return sleepScheduleRepository.upsertByUserId(userId, {
    timezone,
    startMinuteLocal,
    durationMinutes: durationHours * 60,
    enabled: true,
  });
}

async function clearScheduleForUser(userId) {
  return sleepScheduleRepository.upsertByUserId(userId, getDefaultSchedulePayload());
}

function isSleepingNow(schedule, now = new Date()) {
  return isInSleepWindow(now, schedule);
}

function getSleepSummary(schedule, now = new Date()) {
  const sleeping = isInSleepWindow(now, schedule);
  const remainingMs = getRemainingSleepMs(now, schedule);

  return {
    timezone: schedule.timezone,
    startLocalTime: formatMinuteOfDay(schedule.startMinuteLocal),
    durationHours: Math.floor(schedule.durationMinutes / 60),
    enabled: schedule.enabled,
    sleeping,
    remainingMs,
  };
}

module.exports = {
  clearScheduleForUser,
  getDefaultSchedulePayload,
  getScheduleForUser,
  getSleepSummary,
  isSleepingNow,
  setScheduleForUser,
};
