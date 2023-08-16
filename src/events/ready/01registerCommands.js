const get_local_commands = require("../../utils/getLocalCommands");
const get_application_commands = require("../../utils/getApplicationCommands");
const are_commands_different = require("../../utils/areCommandsDifferent");

const { Client } = require("discord.js");

/**
 * @brief Register local commands on bot
 * @param {Client} client
 */
module.exports = async (client) => {
  try {
    const localCommands = get_local_commands();
    const applicationCommands = await get_application_commands(client);

    for (const localCommand of localCommands) {
      const { name, description, options, deleted } = localCommand;

      // Checking if command exists on the bot
      const existingCommand = await applicationCommands.cache.find(
        (cmd) => cmd.name === name
      );

      // If command exist, edit accordingly. If not, add new command
      if (existingCommand) {
        if (deleted) {
          await applicationCommands.delete(existingCommand.id);
          console.log(`Deleted command "${name}".`);
          continue;
        }

        if (are_commands_different(existingCommand, localCommand)) {
          await applicationCommands.edit(existingCommand.id, {
            description,
            options,
          });
          console.log(`Edited command "${name}".`);
        }
      } else {
        if (deleted) {
          console.log(
            `Skipping registering command "${name}" as it's currently set to delete.`
          );
          continue;
        }

        await applicationCommands.create({
          name,
          description,
          options,
        });

        console.log(`Registered command "${name}".`);
      }
    }
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
};
