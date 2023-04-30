const { ActivityType, Client } = require('discord.js');
const userDates = require('../../schemas/dates');
const userStats = require('../../schemas/stats');
const randomNumber = require("../../utils/randomNumber");

/**
 * @brief Periodically check the user's last care dates for kirby
 */
module.exports = () => {

    const minutes = 60;
    const milliConversion = 60000;
    const min = 0;
    const max = 100;
    const sleeptime = 480 * milliConversion;


    setInterval(async () => {
        // Grab all users
        const allUsers = await userStats.find().select('userId hp hunger affection');
        console.log(allUsers);

        if (allUsers) {
            // For each user, check difference between last care times
            allUsers.forEach(async (user) => {
                const userDate = await userDates.findOne({ userId: user.userId });
                const currentDate = new Date();

                // Check if Kirby has ever slept
                if (userDate.lastSleep) {
                    // If Kirby is still asleep, skip the care check
                    if (currentDate < (userDate.lastSleep + sleeptime)) {
                        return;
                    }
                }

                // Decrease hunger
                if ((currentDate - userDate.lastFeed) > (minutes * milliConversion)) {
                    user.hunger -= randomNumber(10, 30);
                    if (user.hunger < min) {
                        user.hunger = min;
                    }
                }

                // Decrease affection
                if (((currentDate - userDate.lastPet) > (minutes * milliConversion)) || ((currentDate - userDate.lastPlay) > (minutes * milliConversion))) {
                    user.affection -= randomNumber(10, 30);
                    if (user.affection < min) {
                        user.affection = min;
                    }
                }

                // Health decrease
                if ((user.affection == min) || (user.hunger == min)) {
                    user.hp -= randomNumber(10, 20);
                    if (user.hp < min) {
                        user.hp = min;
                    }
                }

                // Health increase
                if ((user.affection == max) && (user.hunger == max)) {
                    user.hp += randomNumber(10, 20);
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
    }, (minutes * milliConversion));
};