const env = require("../config/env");

const levelOrder = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = levelOrder[env.logLevel] || levelOrder.info;

function shouldLog(level) {
  return levelOrder[level] >= configuredLevel;
}

function write(level, message, meta = {}) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

module.exports = {
  debug: (message, meta) => write("debug", message, meta),
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
};
