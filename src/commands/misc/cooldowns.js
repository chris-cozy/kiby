const { Client, Interaction, EmbedBuilder } = require('discord.js');
const userStats = require('../../schemas/stats');
const userDates = require('../../schemas/dates');

module.exports = {
    name: 'cooldowns',
    description: 'List the cooldown timers for your Kirby!',
    devonly: false,
    testOnly: false,
    deleted: false,

    /**
     * @brief List the cooldown timers for the user's kirby
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        if (interaction.inGuild()) {
            await interaction.deferReply({ ephemeral: true });
        } else {
            await interaction.deferReply({ ephemeral: false });
        }

        let userKirby = await userStats.findOne({ userId: interaction.user.id });
        let userDate = await userDates.findOne({ userId: interaction.user.id });

        const minutes = 5;
        const milliConversion = 60000;
        const currentDate = new Date();
        const max = 100;
        const pink = '#FF69B4'
        const sleeptime = 480 * milliConversion;

        const playWait = 10 * milliConversion;
        const petWait = 5 * milliConversion;
        const feedWait = 30 * milliConversion;

        let sleepCooldown;
        let petCooldown;
        let playCooldown;
        let feedCooldown;
        let asleep;


        // Check if user owns a kirby
        if (userKirby) {
            try {

                const awakeDate = new Date(userDate.lastSleep.getTime() + sleeptime);

                // If Kirby is still asleep, set cooldowns to wake time. Else, check individual times
                if (currentDate < awakeDate) {
                    asleep = "YES";
                    sleepCooldown = awakeDate.toLocaleString();
                    playCooldown = awakeDate.toLocaleString();
                    feedCooldown = awakeDate.toLocaleString();
                } else {
                    asleep = "NO";
                    sleepCooldown = `${userKirby.kirbyName} is awake`;

                    if (currentDate > (userDate.lastPlay.getTime() + playWait)) {
                        playCooldown = "CAN PLAY";
                    } else {
                        playCooldown = new Date(userDate.lastPlay.getTime() + playWait).toLocaleTimeString();
                    }

                    if (currentDate > (userDate.lastFeed.getTime() + feedWait)) {
                        feedCooldown = "CAN FEED";
                    } else {
                        feedCooldown = new Date(userDate.lastFeed.getTime() + feedWait).toLocaleTimeString;
                    }
                }

                if (currentDate > (userDate.lastPet.getTime() + petWait)) {
                    petCooldown = "CAN PET";
                } else {
                    petCooldown = new Date(userDate.lastPet.getTime() + petWait).toLocaleTimeString();
                }

                const embed = new EmbedBuilder()
                    .setTitle('**COOLDOWNS**')
                    .setColor(pink)
                    .setDescription(`The times when you can interact with **${userKirby.kirbyName}**!`)
                    .addFields(
                        {
                            name: 'Asleep',
                            value: `${asleep}`,
                            inline: true
                        },
                        {
                            name: 'Wake Time',
                            value: `${sleepCooldown}`,
                            inline: true
                        },
                    )
                    .addFields(
                        {
                            name: 'Pet',
                            value: `${petCooldown}`,
                            inline: true
                        },
                        {
                            name: 'Play',
                            value: `${playCooldown}`,
                            inline: true
                        },
                        {
                            name: 'Feed',
                            value: `${feedCooldown}`,
                            inline: true
                        },
                    )
                    .setTimestamp()
                    .setFooter({ text: `${client.user.tag} `, iconURL: `${client.user.displayAvatarURL()}` });


                interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.log(`there was an error: ${error}`);
            }
        } else {
            interaction.editReply(`You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey.`);
            return;
        }
    },
}