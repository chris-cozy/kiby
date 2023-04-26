const { testServer } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');
const getApplicationCommands = require('../../utils/getApplicationCommands');
const areCommandsDifferent = require('../../utils/areCommandsDifferent');
const { Client } = require('discord.js');

/**
 * @brief Register local commands on bot
 * @param {Client} client 
 */
module.exports = async (client) => {
    try {
        // Get bot's commands
        const localCommands = getLocalCommands();
        const applicationCommands = await getApplicationCommands(client, testServer);

        for (const localCommand of localCommands) {
            const { name, description, options } = localCommand;

            // Checking if command exists on the bot
            const existingCommand = await applicationCommands.cache.find(
                (cmd) => cmd.name === name
            );

            // If command exist, edit accordingly. If not, add new command
            if (existingCommand) {
                if (localCommand.deleted) {
                    await applicationCommands.delete(existingCommand.id);
                    console.log(`Deleted command "${name}".`);
                    continue;
                }

                if (areCommandsDifferent(existingCommand, localCommand)) {
                    await applicationCommands.edit(existingCommand.id, { description, options });
                    console.log(`Edited command "${name}".`);
                }
            } else {
                if (localCommand.deleted) {
                    console.log(`Skipping registering command "${name}" as it's currently set to delete.`);
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
        console.log(`There was an error: ${error}`)
    }
};