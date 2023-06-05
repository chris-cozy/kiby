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

        const adopt = new command();
        const media = await adopt.get_media_attachment();
        const targetName = interaction.options.get('name').value;

        try {
            let userKirby = await userStats.findOne({ userId: interaction.user.id });

            if (userKirby) {
                interaction.editReply(`You already have **${userKirby.kirbyName}** to take care of!`);
                return;
            }

            const userDate = new userDates({
                userId: interaction.user.id,
            });

            userKirby = new userStats({
                userId: interaction.user.id,
                kirbyName: targetName,
                adoptDate: new Date(),
            });

            await userKirby.save();
            await userDate.save();

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
};