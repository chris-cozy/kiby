const { Client, GatewayIntentBits, Partials } = require("discord.js");
const mongoose = require("mongoose");
const { AutoPoster } = require("topgg-autoposter");
const env = require("./config/env");
const logger = require("./utils/logger");
const eventHandler = require("./handlers/eventHandler");
const { createHealthServer } = require("./http/healthServer");

const state = {
  dbReady: false,
  discordReady: false,
  startedAt: new Date().toISOString(),
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

const healthServer = createHealthServer({
  port: env.healthPort,
  logger,
  getState: () => ({
    dbReady: state.dbReady,
    discordReady: state.discordReady,
    uptimeSeconds: Math.floor(process.uptime()),
    startedAt: state.startedAt,
  }),
});

client.once("ready", () => {
  state.discordReady = true;
});

client.once("shardDisconnect", () => {
  state.discordReady = false;
});

async function bootstrap() {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(env.mongoConnection);
    state.dbReady = true;
    logger.info("Connected to MongoDB");

    eventHandler(client);
    healthServer.listen();

    await client.login(env.token);
    logger.info("Discord login successful");

    if (env.topggKey) {
      const autoposter = AutoPoster(env.topggKey, client);
      autoposter.on("posted", (stats) => {
        logger.info("Posted server stats to top.gg", {
          serverCount: stats.serverCount,
        });
      });
      autoposter.on("error", (error) => {
        logger.warn("Top.gg autopost failed", { error: error.message });
      });
    }
  } catch (error) {
    logger.error("Failed to bootstrap application", { error: error.message });
    process.exitCode = 1;
    await shutdown();
  }
}

let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  logger.info("Starting graceful shutdown");

  try {
    if (client.kibyScheduler) {
      client.kibyScheduler.stop();
    }

    await healthServer.close();
    await client.destroy();
    await mongoose.disconnect();
    state.dbReady = false;
    state.discordReady = false;
  } catch (error) {
    logger.error("Error during shutdown", { error: error.message });
  }
}

process.on("SIGINT", async () => {
  await shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await shutdown();
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    reason: reason && reason.message ? reason.message : String(reason),
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error.message });
});

bootstrap();
