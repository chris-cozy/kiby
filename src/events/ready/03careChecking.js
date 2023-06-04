const { ActivityType, Client } = require('discord.js');
const userDates = require('../../schemas/dates');
const userStats = require('../../schemas/stats');
const random_number = require("../../utils/randomNumber");
const hunger_notification = require("../../utils/hungerNotification");

/**
 * @brief Periodically check the user's last care dates for kirby
 * @param {Client} client
 */
module.exports = (client) => {

    const milliConversion = 60000;
    const timer = 120 * milliConversion
    const sleeptimer = 540 * milliConversion;
    const min = 0;
    const max = 100;



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
                if ((currentDate - userDate.lastFeed) > timer) {
                    user.hunger -= random_number(10, 30);
                    if (user.hunger < min) {
                        user.hunger = min;
                    }
                    if (user.hunger < 50) {
                        hunger_notification(user);
                    }
                }

                // Decrease affection
                if (((currentDate - userDate.lastPet) > timer) || ((currentDate - userDate.lastPlay) > timer)) {
                    user.affection -= random_number(10, 30);
                    if (user.affection < min) {
                        user.affection = min;
                    }
                }

                // Health decrease
                if ((user.affection == min) || (user.hunger == min)) {
                    user.hp -= random_number(10, 20);
                    if (user.hp < min) {
                        user.hp = min;
                    }
                }

                // Health increase
                if ((user.affection == max) && (user.hunger == max)) {
                    user.hp += random_number(10, 20);
                    if (user.hp > max) {
                        user.hp = max;
                    }
                }

                // Save database updates
                await user.save().catch((e) => {
                    console.log(`There was an error saving: ${e}`);
                });

                // Delete user data from database
                if ((user.hp == min)) {
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
    }, timer);
};