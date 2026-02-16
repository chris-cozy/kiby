const { safeDefer, safeReply } = require("../../utils/interactionReply");

module.exports = {
  name: "ping",
  description: "Check bot latency.",
  deleted: false,
  devOnly: false,
  testOnly: false,

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });
    const reply = await interaction.fetchReply();
    const apiPing = reply.createdTimestamp - interaction.createdTimestamp;

    await safeReply(interaction, {
      content: `pong! api **${apiPing}ms**, websocket **${client.ws.ping}ms**`,
      ephemeral: true,
    });
  },
};
