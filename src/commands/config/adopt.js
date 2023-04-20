const { Client, Interaction, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const userStats = require('../../schemas/stats');

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
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.inGuild()) {
            interaction.editReply("You can only run this command inside of a server.");
            return;
        }

        const targetName = interaction.options.get('name').value;

        // If user has a kirby, exit. If not, create it
        try {
            let userKirby = await userStats.findOne({ userId: interaction.user.id });

            if (userKirby) {
                interaction.editReply(`You already have **${userKirby.kirbyName}** to take care of!`);
                return;
            } else {
                userKirby = new userStats({
                    userId: interaction.user.id,
                    kirbyName: targetName,
                });
            }

            await userKirby.save();
            interaction.editReply(`You now own a kirby! **${targetName}** is a nice name for them.`);
        } catch (error) {
            console.log(`There was an error: $${error}`);
        }
    }
}