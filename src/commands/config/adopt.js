const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const userStats = require('../../schemas/stats');
const userDates = require('../../schemas/dates');
const getMedia = require('../../utils/getMedia');

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

            // Attaching media file
            const mediaFile = await getMedia('portrait');
            const mediaAttach = new AttachmentBuilder(mediaFile.url);

            // Create embed to send
            const embed = new EmbedBuilder()
                .setTitle(client.user.username)
                .setColor('Random')
                .setDescription(`You have adopted a Kirby! **${targetName}** is a nice name for them.`)
                .setThumbnail(client.user.displayAvatarURL())
                .setImage('attachment://' + mediaFile.name)
                .setTimestamp()
                .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL()}` });

            interaction.editReply({ embeds: [embed], files: [mediaAttach] });
        } catch (error) {
            console.log(`There was an error: $${error}`);
        }
    }
}