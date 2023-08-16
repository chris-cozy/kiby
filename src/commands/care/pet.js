const { Client, Interaction, EmbedBuilder } = require("discord.js");
const userStats = require("../../schemas/stats");
const userDates = require("../../schemas/dates");
const calculate_xp_for_level = require("../../utils/calculateXpForLevel");
const random_number = require("../../utils/randomNumber");
const command = require("../../classes/command");

module.exports = {
  name: "pet",
  description: "Pet your Kirby!",
  devonly: false,
  testOnly: false,
  deleted: false,

  /**
   * @brief Pet user's Kirby
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const pet = new command(5);
    let media = await pet.get_media_attachment("play");

    const deferOptions = { ephemeral: interaction.inGuild() };
    await interaction.deferReply(deferOptions);

    const userKirby = await userStats.findOne({ userId: interaction.user.id });
    const userDate = await userDates.findOne({ userId: interaction.user.id });

    // Check if user owns a Kirby
    if (!userKirby) {
      interaction.editReply(
        "You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey."
      );
      return;
    }

    try {
      const awakeDate = new Date(userDate.lastSleep.getTime() + pet.sleepTime);

      // If Kirby is still asleep, alter image
      if (pet.currentDate < awakeDate) {
        media = await pet.get_media_attachment("sleep");
      }

      // Check if it has been enough time since last pet
      if (pet.currentDate - userDate.lastPet < pet.interactionCooldown) {
        interaction.editReply({
          content: `You can only pet ${userKirby.kirbyName} every ${pet.cooldownMins} minutes! They need personal space too!`,
          ephemeral: true,
        });
        return;
      }

      // Generate affection and XP amount
      let affectionGranted = random_number(4, 6);
      const xpGranted = random_number(5, 15);

      if (userKirby.affection + affectionGranted > pet.max) {
        affectionGranted = pet.max - userKirby.affection;
      }

      // Update pet and XP in the database
      userDate.lastPet = pet.currentDate;
      userKirby.affection += affectionGranted;
      userKirby.xp += xpGranted;

      // If user's XP exceeds that for the current level
      if (userKirby.xp > calculate_xp_for_level(userKirby.level)) {
        userKirby.xp = 0;
        userKirby.level += 1;

        interaction.editReply({
          content: `**${userKirby.kirbyName}** has leveled up to level **${userKirby.level}**!`,
        });
      }

      // Save database updates
      await Promise.all([userKirby.save(), userDate.save()]);
      const embed = create_pet_embed(
        client,
        userKirby,
        affectionGranted,
        media.mediaString,
        pet,
        interaction,
        xpGranted
      );

      interaction.editReply({ embeds: [embed], files: [media.mediaAttach] });
    } catch (error) {
      console.error(`Error in pet.js: ${error}`);
    }
  },
};

function create_pet_embed(
  client,
  userKirby,
  affectionGranted,
  mediaString,
  pet,
  interaction,
  xpGranted
) {
  return new EmbedBuilder()
    .setTitle("**PETTING**")
    .setColor(pet.pink)
    .setDescription(
      `**${interaction.user.username}** is petting **${userKirby.kirbyName}**!`
    )
    .addFields(
      {
        name: "Health",
        value: `${userKirby.hp}`,
        inline: true,
      },
      {
        name: "Affection",
        value: `${userKirby.affection} -> ${
          userKirby.affection + affectionGranted
        }`,
        inline: true,
      },
      {
        name: "XP",
        value: `+${xpGranted}`,
        inline: true,
      }
    )
    .setImage(mediaString)
    .setTimestamp()
    .setFooter({
      text: `${client.user.username} `,
      iconURL: `${client.user.displayAvatarURL()}`,
    });
}
