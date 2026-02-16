const path = require("path");
const getAllFiles = require("../utils/getAllFiles");
const logger = require("../utils/logger");

module.exports = (client) => {
  const eventFolders = getAllFiles(path.join(__dirname, "..", "events"), true)
    .slice()
    .sort((a, b) => a.localeCompare(b));

  for (const eventFolder of eventFolders) {
    const eventFiles = getAllFiles(eventFolder)
      .slice()
      .sort((a, b) => a.localeCompare(b));
    const eventName = eventFolder.replace(/\\/g, "/").split("/").pop();

    const handler = async (arg) => {
      for (const eventFile of eventFiles) {
        try {
          const eventFunction = require(eventFile);
          await eventFunction(client, arg);
        } catch (error) {
          logger.error("Event handler failed", {
            eventName,
            eventFile,
            error: error.message,
          });
        }
      }
    };

    if (eventName === "ready") {
      client.once(eventName, handler);
    } else {
      client.on(eventName, handler);
    }
  }
};
