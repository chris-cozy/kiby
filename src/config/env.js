const dotenv = require("dotenv");

dotenv.config();

const LOG_LEVELS = ["debug", "info", "warn", "error"];

function parseInteger(value, defaultValue, options = {}) {
  const { min, max, fieldName } = options;

  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be an integer.`);
  }

  if (min !== undefined && parsed < min) {
    throw new Error(`${fieldName} must be at least ${min}.`);
  }

  if (max !== undefined && parsed > max) {
    throw new Error(`${fieldName} must be at most ${max}.`);
  }

  return parsed;
}

function parseBoolean(value, defaultValue) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalized = String(value).toLowerCase();

  if (normalized === "true" || normalized === "1") {
    return true;
  }

  if (normalized === "false" || normalized === "0") {
    return false;
  }

  throw new Error(`Invalid boolean value: ${value}`);
}

function validateTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function parseSleepStart(localTime) {
  const match = /^(\d{2}):(\d{2})$/.exec(localTime || "");
  if (!match) {
    throw new Error("DEFAULT_SLEEP_START must be in HH:mm format.");
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);

  if (hour > 23 || minute > 59) {
    throw new Error("DEFAULT_SLEEP_START must be a valid 24-hour time.");
  }

  return hour * 60 + minute;
}

function parseCsv(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function readEnvironment() {
  const errors = [];

  const token = process.env.TOKEN;
  if (!token) {
    errors.push("TOKEN is required.");
  }

  const mongoConnection = process.env.MONGO_CONNECTION;
  if (!mongoConnection) {
    errors.push("MONGO_CONNECTION is required.");
  }

  const logLevel = process.env.LOG_LEVEL || "info";
  if (!LOG_LEVELS.includes(logLevel)) {
    errors.push(`LOG_LEVEL must be one of: ${LOG_LEVELS.join(", ")}.`);
  }

  const defaultTimeZone = process.env.DEFAULT_SLEEP_TIMEZONE || "UTC";
  if (!validateTimeZone(defaultTimeZone)) {
    errors.push(`DEFAULT_SLEEP_TIMEZONE is invalid: ${defaultTimeZone}`);
  }

  let defaultSleepStartMinute = 23 * 60;
  try {
    defaultSleepStartMinute = parseSleepStart(
      process.env.DEFAULT_SLEEP_START || "23:00"
    );
  } catch (error) {
    errors.push(error.message);
  }

  let config;
  try {
    config = {
      nodeEnv: process.env.NODE_ENV || "development",
      logLevel,
      token,
      mongoConnection,
      topggKey: process.env.TOPGG_KEY || "",
      testGuildId: process.env.TEST_GUILD_ID || "",
      devUserIds: parseCsv(process.env.DEV_USER_IDS),
      healthPort: parseInteger(process.env.HEALTH_PORT, 8080, {
        min: 1,
        max: 65535,
        fieldName: "HEALTH_PORT",
      }),
      careTickMinutes: parseInteger(process.env.CARE_TICK_MINUTES, 30, {
        min: 1,
        fieldName: "CARE_TICK_MINUTES",
      }),
      npcTickMinutes: parseInteger(process.env.NPC_TICK_MINUTES, 60, {
        min: 1,
        fieldName: "NPC_TICK_MINUTES",
      }),
      neglectThresholdMinutes: parseInteger(
        process.env.NEGLECT_THRESHOLD_MINUTES,
        60,
        {
          min: 1,
          fieldName: "NEGLECT_THRESHOLD_MINUTES",
        }
      ),
      defaultSleepTimeZone: defaultTimeZone,
      defaultSleepStartMinute,
      defaultSleepDurationHours: parseInteger(
        process.env.DEFAULT_SLEEP_DURATION_HOURS,
        8,
        {
          min: 1,
          max: 9,
          fieldName: "DEFAULT_SLEEP_DURATION_HOURS",
        }
      ),
      npcEnabled: parseBoolean(process.env.NPC_ENABLED, true),
      npcTotal: parseInteger(process.env.NPC_TOTAL, 36, {
        min: 0,
        fieldName: "NPC_TOTAL",
      }),
      npcCasual: parseInteger(process.env.NPC_CASUAL, 18, {
        min: 0,
        fieldName: "NPC_CASUAL",
      }),
      npcActive: parseInteger(process.env.NPC_ACTIVE, 10, {
        min: 0,
        fieldName: "NPC_ACTIVE",
      }),
      npcCompetitive: parseInteger(process.env.NPC_COMPETITIVE, 0, {
        min: 0,
        fieldName: "NPC_COMPETITIVE",
      }),
      maxKirbyNameLength: parseInteger(process.env.MAX_KIRBY_NAME_LENGTH, 24, {
        min: 3,
        max: 40,
        fieldName: "MAX_KIRBY_NAME_LENGTH",
      }),
      notificationThreshold: parseInteger(process.env.NOTIFICATION_THRESHOLD, 30, {
        min: 1,
        max: 99,
        fieldName: "NOTIFICATION_THRESHOLD",
      }),
      worldEventChancePercent: parseInteger(
        process.env.WORLD_EVENT_CHANCE_PERCENT,
        8,
        {
          min: 0,
          max: 100,
          fieldName: "WORLD_EVENT_CHANCE_PERCENT",
        }
      ),
      globalEventDurationHours: parseInteger(
        process.env.GLOBAL_EVENT_DURATION_HOURS,
        24,
        {
          min: 1,
          max: 168,
          fieldName: "GLOBAL_EVENT_DURATION_HOURS",
        }
      ),
      globalEventGoal: parseInteger(process.env.GLOBAL_EVENT_GOAL, 120, {
        min: 10,
        fieldName: "GLOBAL_EVENT_GOAL",
      }),
      seasonLengthDays: parseInteger(process.env.SEASON_LENGTH_DAYS, 7, {
        min: 7,
        max: 14,
        fieldName: "SEASON_LENGTH_DAYS",
      }),
      reviveBaseCost: parseInteger(process.env.REVIVE_BASE_COST, 160, {
        min: 0,
        fieldName: "REVIVE_BASE_COST",
      }),
      reviveLevelMultiplier: parseInteger(
        process.env.REVIVE_LEVEL_MULTIPLIER,
        22,
        {
          min: 0,
          fieldName: "REVIVE_LEVEL_MULTIPLIER",
        }
      ),
      giftDailyCoinCap: parseInteger(process.env.GIFT_DAILY_COIN_CAP, 300, {
        min: 1,
        fieldName: "GIFT_DAILY_COIN_CAP",
      }),
      giftDailyItemCap: parseInteger(process.env.GIFT_DAILY_ITEM_CAP, 12, {
        min: 1,
        fieldName: "GIFT_DAILY_ITEM_CAP",
      }),
      giftTransferFeePercent: parseInteger(
        process.env.GIFT_TRANSFER_FEE_PERCENT,
        5,
        {
          min: 0,
          max: 25,
          fieldName: "GIFT_TRANSFER_FEE_PERCENT",
        }
      ),
      ambientBehaviorChancePercent: parseInteger(
        process.env.AMBIENT_BEHAVIOR_CHANCE_PERCENT,
        10,
        {
          min: 0,
          max: 100,
          fieldName: "AMBIENT_BEHAVIOR_CHANCE_PERCENT",
        }
      ),
      ambientBehaviorCooldownMinutes: parseInteger(
        process.env.AMBIENT_BEHAVIOR_COOLDOWN_MINUTES,
        360,
        {
          min: 1,
          fieldName: "AMBIENT_BEHAVIOR_COOLDOWN_MINUTES",
        }
      ),
      adventureFailThresholdHp: parseInteger(
        process.env.ADVENTURE_FAIL_THRESHOLD_HP,
        25,
        {
          min: 1,
          max: 99,
          fieldName: "ADVENTURE_FAIL_THRESHOLD_HP",
        }
      ),
      adventureMinStartHp: parseInteger(process.env.ADVENTURE_MIN_START_HP, 60, {
        min: 1,
        max: 100,
        fieldName: "ADVENTURE_MIN_START_HP",
      }),
    };
  } catch (error) {
    errors.push(error.message);
  }

  if (config.seasonLengthDays !== 7 && config.seasonLengthDays !== 14) {
    errors.push("SEASON_LENGTH_DAYS must be 7 or 14.");
  }

  if (errors.length) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join("\n- ")}`);
  }

  const configuredNpcTotal =
    config.npcCasual + config.npcActive + config.npcCompetitive;
  if (config.npcTotal !== configuredNpcTotal) {
    config.npcTotal = configuredNpcTotal;
  }

  return Object.freeze(config);
}

module.exports = readEnvironment();
