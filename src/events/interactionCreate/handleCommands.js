const getLocalCommands = require("../../utils/getLocalCommands");
const { safeReply } = require("../../utils/interactionReply");
const env = require("../../config/env");
const logger = require("../../utils/logger");
const playerAdventureRepository = require("../../repositories/playerAdventureRepository");

const ADVENTURE_CLAIM_GATE_BYPASS = new Set([
  "help",
  "ping",
  "version",
  "tutorial",
  "info",
  "cooldowns",
  "leaderboard",
  "language",
]);

function isAdventureCommandBypass(interaction) {
  if (interaction.commandName !== "adventure") {
    return false;
  }

  try {
    const subcommand = interaction.options.getSubcommand();
    return subcommand === "claim" || subcommand === "status" || subcommand === "locations";
  } catch {
    return false;
  }
}

module.exports = async (_client, interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) {
    return;
  }

  const localCommands = getLocalCommands();

  try {
    const commandObject = localCommands.find((cmd) => cmd.name === interaction.commandName);

    if (!commandObject) {
      return;
    }

    if (interaction.isAutocomplete()) {
      if (typeof commandObject.autocomplete === "function") {
        await commandObject.autocomplete(interaction.client, interaction);
      } else {
        await interaction.respond([]);
      }
      return;
    }

    const devOnly = commandObject.devOnly ?? commandObject.devonly ?? false;
    const testOnly = commandObject.testOnly ?? false;

    if (devOnly) {
      const isDeveloper = env.devUserIds.includes(interaction.user.id);
      if (!isDeveloper) {
        await safeReply(interaction, {
          content: "Only developers are allowed to run this command.",
          ephemeral: true,
        });
        return;
      }
    }

    if (testOnly && env.testGuildId) {
      const inTestGuild = interaction.guild && interaction.guild.id === env.testGuildId;
      if (!inTestGuild) {
        await safeReply(interaction, {
          content: "This command can only run in the configured test guild.",
          ephemeral: true,
        });
        return;
      }
    }

    if (commandObject.permissionsRequired?.length) {
      for (const permission of commandObject.permissionsRequired) {
        if (!interaction.memberPermissions?.has(permission)) {
          await safeReply(interaction, {
            content: "You do not have enough permissions for this command.",
            ephemeral: true,
          });
          return;
        }
      }
    }

    if (commandObject.botPermissionsRequired?.length && interaction.guild) {
      const botPermissions =
        interaction.appPermissions || interaction.guild.members.me?.permissions || null;
      for (const permission of commandObject.botPermissionsRequired) {
        if (!botPermissions?.has(permission)) {
          await safeReply(interaction, {
            content: "I do not have permissions required to run this command.",
            ephemeral: true,
          });
          return;
        }
      }
    }

    if (
      !ADVENTURE_CLAIM_GATE_BYPASS.has(interaction.commandName) &&
      !isAdventureCommandBypass(interaction)
    ) {
      const record = await playerAdventureRepository.findByUserId(interaction.user.id);
      const run = record?.activeRun;
      if (
        run &&
        !run.claimedAt &&
        new Date().getTime() >= new Date(run.resolvedAt).getTime()
      ) {
        await safeReply(interaction, {
          content:
            "Your adventure is complete. Use `/adventure claim` before performing more actions.",
          ephemeral: true,
        });
        return;
      }
    }

    await commandObject.callback(interaction.client, interaction);
  } catch (error) {
    logger.error("Command execution failed", {
      commandName: interaction.commandName,
      error: error.message,
    });

    await safeReply(interaction, {
      content: "There was an unexpected error while running this command.",
      ephemeral: true,
    });
  }
};
