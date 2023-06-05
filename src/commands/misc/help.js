const { Client, Interaction, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Learn more about using Kiby!',
    devonly: false,
    testOnly: false,
    deleted: false,

    /**
     * @brief Send an embed with help information
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });


        try {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `${client.user.username}`, iconURL: `${client.user.displayAvatarURL()}`, url: 'https://top.gg/bot/1095193298425094204?s=06a5543cc78a4' })
                .setTitle('Kiby Documentation')
                .setColor(info.pink)
                .setDescription(`Click the title to travel to Kiby's documentation page! It contains useful bot background and command information.`)
                .setURL('https://top.gg/bot/1095193298425094204?s=06a5543cc78a4')
                .setTimestamp()

            interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.log(`there was an error: ${error}`);
        }
    },
}