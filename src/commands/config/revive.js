const { Client, Interaction, EmbedBuilder } = require("discord.js");
const userStats = require("../../schemas/stats");
const userDates = require("../../schemas/dates");
const userDeaths = require("../../schemas/deaths");
const command = require("../../classes/command");

module.exports = {
  name: "revive",
  description: "Revive your Kiby! (If you have not re-adopted)",
  devonly: false,
  testOnly: false,
  deleted: false,

  /**
   * @brief Revive the user's dead Kirby
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const deferOptions = { ephemeral: interaction.inGuild() };
    await interaction.deferReply(deferOptions);

    const revive = new command();
    const media = await revive.get_media_attachment();

    const userKirby = await userStats.findOne({
      userId: interaction.user.id,
    });

    if (userKirby) {
      return interaction.editReply(
        `You already have **${userKirby.kirbyName}** to take care of!`
      );
    }

    const deadKirby = await userDeaths.findOne({ userId: interaction.user.id });

    if (!deadKirby) {
      return interaction.editReply(
        `You haven't let any Kirbys die! Don't get any ideas...`
      );
    }
    // Handle case with multiple dead kirbys

    if (deadKirby) {
      try {
        const userDate = new userDates({
          userId: deadKirby.userId,
        });

        const userKirby = new userStats({
          userId: deadKirby.userId,
          kirbyName: deadKirby.kirbyName,
          adoptDate: deadKirby.adoptDate,
        });

        await Promise.all([
          userKirby.save(),
          userDate.save(),
          userDeaths.deleteOne({ userId: deadKirby.userId }),
        ]);

        const embed = new EmbedBuilder()
          .setTitle(client.user.username)
          .setColor(revive.pink)
          .setDescription(
            `${userKirby.kirbyName} has been revived! Be more careful next time!`
          )
          .setThumbnail(client.user.displayAvatarURL())
          .setImage(media.mediaString)
          .setTimestamp()
          .setFooter({
            text: `${interaction.user.tag}`,
            iconURL: `${interaction.user.displayAvatarURL()}`,
          });

        interaction.editReply({ embeds: [embed], files: [media.mediaAttach] });
      } catch (error) {
        console.error(`There was an error reviving the kirby: ${error}`);
      }
    }
  },
};
