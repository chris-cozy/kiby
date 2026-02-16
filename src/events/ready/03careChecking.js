const { createScheduler } = require("../../services/schedulerService");
const logger = require("../../utils/logger");

module.exports = async (client) => {
  if (client.kibyScheduler) {
    return;
  }

  const scheduler = createScheduler(client);
  await scheduler.start();

  client.kibyScheduler = scheduler;
  logger.info("Schedulers started");
};
