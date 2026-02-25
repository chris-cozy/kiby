const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "social",
  description: "Legacy social command (scheduled for deletion).",
  deleted: true,
  options: [],

  callback: async (_client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });
    await safeReply(interaction, {
      content: "This command was replaced. Use `/playdate` and `/park` instead.",
      ephemeral: true,
    });
  },
};
