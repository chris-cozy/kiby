const { ActivityType, Client } = require('discord.js');
const userDates = require('../../schemas/dates');
const userStats = require('../../schemas/stats');
const userDeaths = require('../../schemas/deaths');
const random_number = require("../../utils/randomNumber");
const hunger_notification = require("../../utils/hungerNotification");
const affection_notification = require("../../utils/affectionNotification");
const death_notification = require("../../utils/deathNotification");
const construct_sentence = require("../../utils/constructSentence");

/**
 * @brief Periodically check the user's last care dates for kirby
 * @param {Client} client
 */
module.exports = (client) => {

    const milliConversion = 60000;
    const careCheckTimer = 30 * milliConversion;
    const hpDrainMax = 2;
    const hpDrainMin = 1;
    const hpGainMax = 4;
    const hpGainMin = 1;
    const neglectTimer = 60 * milliConversion
    const hungerDrainMax = 10;
    const hungerDrainMin = 5;
    const affectionDrainMax = 10;
    const affectionDrainMin = 5;
    const sleeptimer = 540 * milliConversion;
    const minPoints = 0;
    const maxPoints = 100;
    const minRange = 1;
    const maxRange = 10;

    setInterval(async () => {
        // Grab all users
        const allUsers = await userStats.find();

        if (allUsers) {
            // For each user, check difference between last care times
            for (const user of allUsers) {
                const currentDate = new Date();
                const userDate = await userDates.findOne({ userId: user.userId });
                const awakeDate = new Date(userDate.lastSleep.getTime() + sleeptimer);



                // If Kirby is still asleep, skip the care check
                if (currentDate < awakeDate) {
                    continue;
                }

                // 20% Chance to send random message to user
                const choice = random_number(minRange, maxRange);
                if (choice === minRange || maxRange) {
                    if (user.userId) {
                        const targetUser = await client.users.fetch(user.userId);
                        try {
                            if (targetUser) {
                                targetUser.send({
                                    content: `**${user.kirbyName}**: ` + construct_sentence(),
                                    ephemeral: false,
                                });
                            }
                        } catch (error) {
                            console.log('User has disabled direct messages:', user.userId);
                        }
                    } else {
                        console.log('Invalid user ID:', userStats.userId);
                    }

                }

                // Decrease hunger
                if ((currentDate - userDate.lastFeed) > neglectTimer) {
                    user.hunger -= random_number(hungerDrainMin, hungerDrainMax);
                    if (user.hunger < minPoints) {
                        user.hunger = minPoints;
                    }
                    if (user.hunger < 50) {
                        hunger_notification(client, user);
                    }
                }

                // Decrease affection
                if (((currentDate - userDate.lastPet) > neglectTimer) || ((currentDate - userDate.lastPlay) > neglectTimer)) {
                    user.affection -= random_number(affectionDrainMin, affectionDrainMax);
                    if (user.affection < minPoints) {
                        user.affection = minPoints;
                    }
                    if (user.affection < 50) {
                        affection_notification(client, user);
                    }
                }

                // Health decrease
                if ((user.affection === minPoints) || (user.hunger === minPoints)) {
                    user.hp -= random_number(hpDrainMin, hpDrainMax);
                    if (user.hp < minPoints) {
                        user.hp = minPoints;
                    }
                }

                // Health increase
                if ((user.affection === maxPoints) && (user.hunger === maxPoints)) {
                    user.hp += random_number(hpGainMin, hpGainMax);
                    if (user.hp > maxPoints) {
                        user.hp = maxPoints;
                    }
                }

                // Save database updates
                await user.save().catch((e) => {
                    console.log(`There was an error saving: ${e}`);
                });

                // Delete user data from database
                if (user.hp === minPoints) {
                    death_notification(client, user);

                    //Log Death
                    const userDeath = new userDeaths({
                        userId: user.userId,
                        kirbyName: user.kirbyName,
                        level: user.level,
                        adoptDate: user.adoptDate,
                        deathDate: new Date(),
                    });



                    try {
                        await Promise.all([
                            userDeath.save(),
                            userStats.deleteOne({ userId: user.userId }),
                            userDates.deleteOne({ userId: user.userId }),

                        ]);
                    } catch (error) {
                        console.log(`There was an error: ${error}`);
                    }
                }
            }
        } else {
            console.log('There are no active Kirbys!');
        }
    }, careCheckTimer);
};