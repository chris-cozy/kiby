const { Client, Interaction } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'ping pong - client and websocket ping',
    devonly: true,
    testOnly: true,

    /**
     * @brief Send the client and websocket ping
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const deferOptions = { ephemeral: !interaction.inGuild() };
        await interaction.deferReply(deferOptions);

        const reply = await interaction.fetchReply();

        const ping = reply.createdTimestamp - interaction.createdTimestamp;
        interaction.editReply(`pong! poyoyo **${ping}ms**, poyo poy **${client.ws.ping}ms**`);
    },
}