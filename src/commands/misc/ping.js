/**
 * Send the client's websocket ping
 */
module.exports = {
    name: 'ping',
    description: 'ping pong - client and websocket ping',
    devonly: true,
    testOnly: true,

    callback: async (client, interaction) => {
        await interaction.deferReply();

        const reply = await interaction.fetchReply();

        const ping = reply.createdTimestamp - interaction.createdTimestamp;
        interaction.editReply(`pong! poyoyo poyo ${ping}ms, poyo poy poyyoy ${client.ws.ping}ms`);
    },
}