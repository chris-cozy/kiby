const { ActivityType, Client } = require("discord.js");

const userDates = require("../../schemas/dates");
const userStats = require("../../schemas/stats");
const userDeaths = require("../../schemas/deaths");
const random_number = require("../../utils/randomNumber");
const hunger_notification = require("../../utils/notifications/hungerNotification");
const affection_notification = require("../../utils/notifications/affectionNotification");
const death_notification = require("../../utils/notifications/deathNotification");
const construct_sentence = require("../../utils/constructSentence");

/**
 * @brief Periodically check the user's last care dates for kirby
 * @param {Client} client
 */
module.exports = (client) => {
  const milliConversion = 60000;
  const careCheckTimer = 30 * milliConversion;
  const neglectTimer = 60 * milliConversion;
  const sleeptimer = 540 * milliConversion;
  const pointFloor = 0;
  const pointCeiling = 100;
  const rangeFloor = 1;
  const rangeCeiling = 100;

  const hpDrainMax = 0.15 * 30;
  const hpDrainMin = 0.25 * 30;
  const hpGainMax = 0.12 * 30;
  const hpGainMin = 0.08 * 30;

  const hungerDrainMax = 0.12 * 30;
  const hungerDrainMin = 0.08 * 30;
  const affectionDrainMax = 0.06 * 30;
  const affectionDrainMin = 0.04 * 30;

  setInterval(async () => {
    // Grab all users
    const allUsers = await userStats.find();

    if (allUsers) {
      // For each user, check difference between last care times
      for (const user of allUsers) {
        const currentDate = new Date();
        const { userId, kirbyName, level, adoptDate } = user;
        const userDate = await userDates.findOne({ userId: userId });
        const awakeDate = new Date(userDate.lastSleep.getTime() + sleeptimer);

        // If Kirby is still asleep, skip the care check
        if (currentDate < awakeDate) {
          continue;
        }

        // 5% Chance to send random message to user
        if (random_number(rangeFloor, rangeCeiling) <= 5) {
          const targetUser = await client.users.fetch(userId);
          if (targetUser) {
            try {
              const dmChannel = await targetUser.createDM();
              dmChannel.send({
                content: `**${kirbyName}**: ` + construct_sentence(),
                ephemeral: false,
              });
            } catch (error) {
              console.log("User has disabled direct messages:", userId);
            }
          }
        }

        const decrease_hunger = () => {
          user.hunger -= random_number(hungerDrainMin, hungerDrainMax);
          if (user.hunger < pointFloor) {
            user.hunger = pointFloor;
          }
          if (user.hunger <= 50 && user.hunger >= 40) {
            hunger_notification(client, user);
          }
        };

        // Decrease affection
        const decrease_affection = () => {
          user.affection -= random_number(affectionDrainMin, affectionDrainMax);
          if (user.affection < pointFloor) {
            user.affection = pointFloor;
          }
          if (user.affection <= 50 && user.affection >= 40) {
            affection_notification(client, user);
          }
        };

        if (currentDate - userDate.lastFeed > neglectTimer) {
          decrease_hunger();
        }

        if (
          currentDate - userDate.lastPet > neglectTimer ||
          currentDate - userDate.lastPlay > neglectTimer
        ) {
          decrease_affection();
        }

        // Health decrease
        if (user.affection === pointFloor || user.hunger === pointFloor) {
          user.hp -= random_number(hpDrainMin, hpDrainMax);
          if (user.hp < pointFloor) {
            user.hp = pointFloor;
          }
        }

        // Health increase
        if (user.affection === pointCeiling && user.hunger === pointCeiling) {
          user.hp += random_number(hpGainMin, hpGainMax);
          if (user.hp > pointCeiling) {
            user.hp = pointCeiling;
          }
        }

        // Save database updates
        await user.save().catch((e) => {
          console.log(`There was an error saving: ${e}`);
        });

        // Delete user data from database
        if (user.hp === pointFloor) {
          death_notification(client, user);

          //Log Death
          const userDeath = new userDeaths({
            userId: userId,
            kirbyName: kirbyName,
            level: level,
            adoptDate: adoptDate,
            deathDate: new Date(),
          });

          try {
            await Promise.all([
              userDeath.save(),
              userStats.deleteOne({ userId: userId }),
              userDates.deleteOne({ userId: userId }),
            ]);
          } catch (error) {
            console.log(`There was an error: ${error}`);
          }
        }
      }
    } else {
      console.log("There are no active Kirbys!");
    }
  }, careCheckTimer);
};
