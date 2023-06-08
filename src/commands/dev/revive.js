const { Client, Interaction, EmbedBuilder } = require('discord.js');
const userStats = require('../../schemas/stats');
const userDates = require('../../schemas/dates');
const userDeaths = require('../../schemas/deaths');
const command = require('../../classes/command');

module.exports = {
    name: 'revive',
    description: 'Revive all dead Kibys! (If owner has not re-adopted)',
    devonly: true,
    testOnly: false,
    deleted: false,

    /**
     * @brief Revive all dead Kirbys
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const deferOptions = { ephemeral: interaction.inGuild() };
        await interaction.deferReply(deferOptions);

        const revive = new command();
        const media = await revive.get_media_attachment();
        let reviveNum = 0;

        const deadKirbys = await userDeaths.find();

        if (deadKirbys) {
            for (const kirby of deadKirbys) {

                const user = await userStats.findOne({ userId: kirby.userId });
                if (user) {
                    continue;
                }

                try {
                    const userDate = new userDates({
                        userId: kirby.userId,
                    });

                    const userKirby = new userStats({
                        userId: kirby.userId,
                        kirbyName: kirby.kirbyName,
                        adoptDate: kirby.adoptDate,
                    });

                    await Promise.all([
                        userKirby.save(),
                        userDate.save(),
                        userDeaths.deleteOne({ userId: kirby.userId }),
                    ]);

                    reviveNum++;

                } catch (error) {
                    console.log(`There was an error reviving the kirby: ${error}`);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(client.user.username)
                .setColor(adopt.pink)
                .setDescription(`${reviveNum} Kirby's have been revived!`)
                .setThumbnail(client.user.displayAvatarURL())
                .setImage(media.mediaString)
                .setTimestamp()
                .setFooter({ text: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL()}` });

            interaction.editReply({ embeds: [embed], files: [media.mediaAttach] });
        }
    },
}