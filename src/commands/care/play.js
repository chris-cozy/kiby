const { Client, Interaction, EmbedBuilder } = require("discord.js");
const userStats = require("../../schemas/stats");
const userDates = require("../../schemas/dates");
const calculate_xp_for_level = require("../../utils/calculateXpForLevel");
const random_number = require("../../utils/randomNumber");
const command = require("../../classes/command");

module.exports = {
  name: "play",
  description: "Play with your Kirby!",
  devonly: false,
  testOnly: false,
  deleted: false,

  /**
   * @brief Play with user's Kirby
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const play = new command(10);
    const media = await play.get_media_attachment("play");

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
      const awakeDate = new Date(userDate.lastSleep.getTime() + play.sleepTime);

      // If Kirby is still asleep, show an error message
      if (play.currentDate < awakeDate) {
        interaction.editReply(
          `You can't play with ${userKirby.kirbyName} while they're asleep!`
        );
        return;
      }

      // Check if it has been enough time since last affection
      if (play.currentDate - userDate.lastPlay < play.interactionCooldown) {
        interaction.editReply({
          content: `You can only play ${userKirby.kirbyName} every ${play.cooldownMins} minutes! They need personal time too!`,
          ephemeral: true,
        });
        return;
      }

      // Generate affection and xp amount
      let affectionGranted = random_number(6, 10);
      const xpGranted = random_number(10, 20);

      if (userKirby.affection + affectionGranted > play.max) {
        affectionGranted = play.max - userKirby.affection;
      }

      // Update feed and XP in the database
      userDate.lastPlay = play.currentDate;
      userKirby.affection += affectionGranted;
      userKirby.xp += xpGranted;

      // If user's XP exceeds that for current level
      if (userKirby.xp > calculate_xp_for_level(userKirby.level)) {
        userKirby.xp = 0;
        userKirby.level += 1;

        interaction.editReply({
          content: `**${userKirby.kirbyName}** has leveled up to level **${userKirby.level}**!`,
        });
      }

      // Save database updates
      await Promise.all([userKirby.save(), userDate.save()]);
      const embed = create_play_embed(
        client,
        userKirby,
        affectionGranted,
        media.mediaString
      );

      interaction.editReply({ embeds: [embed], files: [media.mediaAttach] });
    } catch (error) {
      console.error(`Error in play.js: ${error}`);
    }
  },
};

function create_play_embed(client, userKirby, affectionGranted, mediaString) {
  return new EmbedBuilder()
    .setTitle("**PLAYING**")
    .setColor(play.pink)
    .setDescription(
      `**${interaction.user.username}** is playing with **${userKirby.kirbyName}**!`
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
