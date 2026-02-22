const getLocalCommands = require("../../utils/getLocalCommands");
const getApplicationCommands = require("../../utils/getApplicationCommands");
const areCommandsDifferent = require("../../utils/areCommandsDifferent");
const env = require("../../config/env");
const logger = require("../../utils/logger");
const topggCommandSyncService = require("../../services/topggCommandSyncService");

module.exports = async (client) => {
  try {
    const localCommands = getLocalCommands.refresh();
    const syncCommands = async (applicationCommands, scope) => {
      for (const localCommand of localCommands) {
        const { name, description, options, deleted } = localCommand;
        const existingCommand = applicationCommands.cache.find(
          (command) => command.name === name
        );

        if (existingCommand) {
          if (deleted) {
            await applicationCommands.delete(existingCommand.id);
            logger.info("Deleted command", { name, scope });
            continue;
          }

          if (areCommandsDifferent(existingCommand, localCommand)) {
            await applicationCommands.edit(existingCommand.id, {
              name,
              description,
              options,
            });
            logger.info("Updated command", { name, scope });
          }
          continue;
        }

        if (deleted) {
          logger.info("Skipped deleted command", { name, scope });
          continue;
        }

        await applicationCommands.create({
          name,
          description,
          options,
        });
        logger.info("Registered command", { name, scope });
      }
    };

    const globalCommands = await getApplicationCommands(client, null);
    await syncCommands(globalCommands, "global");

    if (env.testGuildId) {
      const guildCommands = await getApplicationCommands(client, env.testGuildId);
      await syncCommands(guildCommands, `guild:${env.testGuildId}`);
    }

    const syncResult = await topggCommandSyncService.publishLocalCommands(localCommands, {
      token: env.topggCommandSyncToken,
    });

    if (syncResult.ok) {
      logger.info("Pushed slash command definitions to top.gg", {
        commandCount: syncResult.commandCount,
      });
    } else if (!syncResult.skipped) {
      logger.warn("Failed to push slash command definitions to top.gg", {
        reason: syncResult.reason,
        statusCode: syncResult.statusCode,
        error: syncResult.error,
      });
    }
  } catch (error) {
    logger.error("Failed to register commands", { error: error.message });
  }
};
