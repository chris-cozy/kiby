const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const userStats = require('../../schemas/stats');
const userDates = require('../../schemas/dates');
const command = require('../../classes/command');

module.exports = {
    name: 'adopt',
    description: "Adopt your kirby!",
    deleted: false,
    options: [
        {
            name: 'name',
            description: "Choose your kirby's name.",
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],

    /**
     * @brief Allow user to set up their kirby
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: false });

        if (!interaction.inGuild()) {
            interaction.editReply("You can only run this command inside of a server.");
            return;
        }

        const adopt = new command();
        const media = await adopt.get_media_attachment();
        const targetName = interaction.options.get('name').value;

        // If user has a kirby, exit. If not, create it
        try {
            let userKirby = await userStats.findOne({ userId: interaction.user.id });
            let userDate = await userDates.findOne({ userId: interaction.user.id });

            if (userKirby) {
                interaction.editReply(`You already have **${userKirby.kirbyName}** to take care of!`);
                return;
            } else {
                userKirby = new userStats({
                    userId: interaction.user.id,
                    kirbyName: targetName,
                    adoptDate: new Date(),
                });

                userDate = new userDates({
                    userId: interaction.user.id,
                });
            }

            await userKirby.save();
            await userDate.save();

            // Create embed to send
            const embed = new EmbedBuilder()
                .setTitle(client.user.username)
                .setColor(adopt.pink)
                .setDescription(`You have adopted a Kirby! **${targetName}** is a nice name for them.`)
                .setThumbnail(client.user.displayAvatarURL())
                .setImage(media.mediaString)
                .setTimestamp()
                .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL()}` });

            interaction.editReply({ embeds: [embed], files: [media.mediaAttach] });
        } catch (error) {
            console.log(`There was an error: $${error}`);
        }
    }
}