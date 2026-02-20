const { ActivityType } = require("discord.js");
const logger = require("../../utils/logger");

module.exports = async (client) => {
  logger.info("Discord client is online", {
    tag: client.user.tag,
    guildCount: client.guilds.cache.size,
  });

  client.user.setActivity({
    name: "♡ Get started with /help ♡",
    type: ActivityType.Watching,
  });
};
