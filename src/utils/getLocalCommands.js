const path = require("path");
const getAllFiles = require("./getAllFiles");

let cachedCommands = null;

function readCommandsFromDisk() {
  const localCommands = [];
  const commandCategories = getAllFiles(path.join(__dirname, "..", "commands"), true)
    .slice()
    .sort((a, b) => a.localeCompare(b));

  for (const category of commandCategories) {
    const commandFiles = getAllFiles(category)
      .slice()
      .sort((a, b) => a.localeCompare(b));

    for (const commandFile of commandFiles) {
      delete require.cache[require.resolve(commandFile)];
      const commandObject = require(commandFile);
      localCommands.push(commandObject);
    }
  }

  return localCommands;
}

module.exports = (exceptions = []) => {
  if (!cachedCommands) {
    cachedCommands = readCommandsFromDisk();
  }

  if (!exceptions.length) {
    return cachedCommands;
  }

  return cachedCommands.filter((command) => !exceptions.includes(command.name));
};

module.exports.refresh = () => {
  cachedCommands = readCommandsFromDisk();
  return cachedCommands;
};
