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


    setInterval(async () => {
        // Grab all users
        const allUsers = await userStats.find().select('userId hp hunger affection');
        console.log(allUsers);

        if (allUsers) {
            // For each user, check difference between last care times
            allUsers.forEach(async (user) => {
                const userDate = await userDates.findOne({ userId: user.userId });
                const currentDate = new Date();

                if ((currentDate - userDate.lastFeed) > (minutes * milliConversion)) {
                    user.hunger -= randomNumber(10, 30);
                    if (user.hunger < 0) {
                        user.hunger = 0;
                    }
                }

                if ((currentDate - userDate.lastAffection) > (minutes * milliConversion)) {
                    user.affection -= randomNumber(10, 30);
                    if (user.affection < 0) {
                        user.affection = 0;
                    }
                }

                if ((user.affection == 0) || (user.hunger == 0)) {
                    user.hp -= randomNumber(10, 20);
                    if (user.hp < 0) {
                        user.hp = 0;
                    }
                }

                // Save database updates
                await user.save().catch((e) => {
                    console.log(`There was an error saving: ${e}`);
                });

                // Delete user data from database
                if ((user.hp == 0)) {
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