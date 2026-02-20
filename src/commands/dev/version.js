const packageInfo = require("../../../package.json");
const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "version",
  description: "Show the current bot application version.",
  deleted: false,
  devOnly: true,
  testOnly: false,

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });

    await safeReply(interaction, {
      content: `Current application version: **${packageInfo.version}**`,
      ephemeral: true,
    });
  },
};
