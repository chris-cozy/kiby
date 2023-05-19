const path = require('path');
const get_all_files = require('./getAllFiles');

/**
 * @brief Grab local commands (in codebase)
 * @param {Array} exceptions - Array of command names to skip over
 * @returns Array of local commmand objects
 */
module.exports = (exceptions = []) => {
    let localCommands = [];

    // Grab all subdirs of command directory
    const commandCategories = get_all_files(
        path.join(__dirname, '..', 'commands'),
        true
    )

    for (const commandCategory of commandCategories) {
        const commandFiles = get_all_files(commandCategory);

        // Create a require() object for each file in command category
        for (const commandFile of commandFiles) {
            const commandObject = require(commandFile);

            // Ignore commands in exceptions
            if (exceptions.includes(commandObject.name)) {
                continue;
            }
            localCommands.push(commandObject);
        }
    }
    return localCommands;
};