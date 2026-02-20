const mongoose = require("mongoose");
const env = require("../config/env");
const logger = require("../utils/logger");
const npcService = require("../services/npcService");

async function run() {
  try {
    await mongoose.connect(env.mongoConnection);
    const shouldReset = process.argv.includes("--reset");
    const result = shouldReset
      ? await npcService.resetNpcSeed()
      : await npcService.ensureNpcSeeded();
    logger.info("Seed script completed", result);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error("Seed script failed", { error: error.message });
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
