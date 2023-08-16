const { Client, Interaction, EmbedBuilder } = require("discord.js");
const userStats = require("../../schemas/stats");
const userDates = require("../../schemas/dates");
const calculate_xp_for_level = require("../../utils/calculateXpForLevel");
const random_number = require("../../utils/randomNumber");
const command = require("../../classes/command");

module.exports = {
  name: "feed",
  description: "Feed your Kirby!",
  devonly: false,
  testOnly: false,
  deleted: false,

  /**
   * @brief Feed's user's Kirby
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const feed = new command(10);
    const media = await feed.get_media_attachment("feed");

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
      const awakeDate = new Date(userDate.lastSleep.getTime() + feed.sleepTime);
      // If Kirby is still asleep, prevent feeding
      if (feed.currentDate < awakeDate) {
        interaction.editReply(
          `You can't feed ${userKirby.kirbyName} while they're asleep!`
        );
        return;
      }

      // Check if kirby is already full
      if (userKirby.hunger === feed.max) {
        interaction.editReply({
          content: `**${userKirby.kirbyName}** is too full!`,
          ephemeral: true,
        });
        return;
      }

      // Check if it has been minimum time since last feed
      if (feed.currentDate - userDate.lastFeed < feed.interactionCooldown) {
        interaction.editReply({
          content: `You can only feed ${userKirby.kirbyName} every ${feed.cooldownMins} minutes!`,
          ephemeral: true,
        });
        return;
      }

      // Generate feed and xp amount
      let feedGranted = random_number(8, 12);
      const xpGranted = random_number(5, 15);

      if (userKirby.hunger + feedGranted > feed.max) {
        feedGranted = feed.max - userKirby.hunger;
      }

      // Update feed and xp in the database
      userDate.lastFeed = feed.currentDate;
      userKirby.hunger += feedGranted;
      userKirby.xp += xpGranted;

      // If user's xp exceeds that for current level
      if (userKirby.xp > calculate_xp_for_level(userKirby.level)) {
        userKirby.xp = 0;
        userKirby.level += 1;

        interaction.editReply({
          content: `**${userKirby.kirbyName}** has leveled up to level **${userKirby.level}**!`,
        });
      }

      // Save database updates
      await Promise.all([userKirby.save(), userDate.save()]);
      const embed = create_feed_embed(
        client,
        userKirby,
        feedGranted,
        media.mediaString,
        feed,
        interaction,
        xpGranted
      );

      interaction.editReply({ embeds: [embed], files: [media.mediaAttach] });
    } catch (error) {
      console.error(`Error in feed.js: ${error}`);
    }
  },
};

function create_feed_embed(
  client,
  userKirby,
  feedGranted,
  mediaString,
  feed,
  interaction,
  xpGranted
) {
  return new EmbedBuilder()
    .setTitle("**FEEDING**")
    .setColor(feed.pink)
    .setDescription(
      `**${interaction.user.username}** has fed **${userKirby.kirbyName}**!`
    )
    .addFields(
      {
        name: "Health",
        value: `${userKirby.hp}`,
        inline: true,
      },
      {
        name: "Hunger",
        value: `${userKirby.hunger - feedGranted} -> ${userKirby.hunger}`,
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
