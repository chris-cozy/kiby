const { ActivityType, Client } = require('discord.js');
const userDates = require('../../schemas/dates');
const userStats = require('../../schemas/stats');
const random_number = require("../../utils/randomNumber");
const hunger_notification = require("../../utils/hungerNotification");
const affection_notification = require("../../utils/affectionNotification");
const death_notification = require("../../utils/deathNotification");

/**
 * @brief Periodically check the user's last care dates for kirby
 * @param {Client} client
 */
module.exports = (client) => {

    const milliConversion = 60000;
    const careCheckTimer = 30 * milliConversion;
    const hpDrainMax = 10;
    const hpDrainMin = 5;
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



    setInterval(async () => {
        // Grab all users
        const allUsers = await userStats.find().select('userId hp hunger affection');
        console.log(allUsers);

        if (allUsers) {
            // For each user, check difference between last care times
            allUsers.forEach(async (user) => {
                const currentDate = new Date();
                const userDate = await userDates.findOne({ userId: user.userId });
                const awakeDate = new Date(userDate.lastSleep.getTime() + sleeptimer);

                // If Kirby is still asleep, skip the care check
                if (currentDate < awakeDate) {
                    return;
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
                if ((user.affection == minPoints) || (user.hunger == minPoints)) {
                    user.hp -= random_number(hpDrainMin, hpDrainMax);
                    if (user.hp < minPoints) {
                        user.hp = minPoints;
                    }
                }

                // Health increase
                if ((user.affection == maxPoints) && (user.hunger == maxPoints)) {
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
                if ((user.hp == minPoints)) {
                    death_notification(client, user);
                    try {
                        const res1 = await userStats.deleteOne({ userId: user.userId });
                        const res2 = await userDates.deleteOne({ userId: user.userId });

                        await res1.save();
                        await res2.save();
                    } catch (error) {
                        console.log(`There was an error: ${error}`);
                    }
                }
            });
        } else {
            console.log('There are no active Kirbys!');
        }
    }, careCheckTimer);
};