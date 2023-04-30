const { Client, Interaction, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const userStats = require('../../schemas/stats');
const userDates = require('../../schemas/dates');
const getMedia = require('../../utils/getMedia');

module.exports = {
    name: 'sleep',
    description: 'Put your Kirby to sleep!',
    devonly: false,
    testOnly: false,
    deleted: false,

    /**
     * @brief Put the Kirby to sleep for 8 hours
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });
        const pink = '#FF69B4'
        const minutes = 480;
        const milliConversion = 60000;
        const currentDate = new Date();
        const awakeDate = new Date(currentDate.getTime() + (minutes * milliConversion));

        // Attaching media file
        const mediaFile = await getMedia('sleep');
        const mediaAttach = new AttachmentBuilder(mediaFile.url);

        try {
            let userKirby = await userStats.findOne({ userId: interaction.user.id });
            let userDate = await userDates.findOne({ userId: interaction.user.id });

            // If user exists, grab dates and check relevance, then update collect date. 
            if (userDate) {
                if (userDate.lastSleep) {
                    // Check if user has slept today
                    if (userDate.lastSleep.toDateString() === currentDate.toDateString()) {
                        interaction.editReply({ content: `**${userKirby.kirbyName}** cannot sleep again until tomorrow!` });
                        return;
                    }
                }
                // Change sleep date
                userDate.lastSleep = currentDate;

                const embed = new EmbedBuilder()
                    .setTitle('**SLEEPING**')
                    .setColor(pink)
                    .setDescription(`**${userKirby.kirbyName}** is sleeping until ${awakeDate.toLocaleString()}!`)
                    .setImage('attachment://' + mediaFile.name)
                    .setTimestamp()
                    .setFooter({ text: `${client.user.tag} `, iconURL: `${client.user.displayAvatarURL()}` });

                // Update database
                await userDate.save().catch((e) => {
                    console.log(`There was an error saving: ${e}`);
                });

                interaction.editReply({ embeds: [embed], files: [mediaAttach] });
            } else {
                interaction.editReply(`You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey.`);
                return;
            }
        } catch (error) {
            console.log(`There was an error: $${error}`);
        }
    },
}