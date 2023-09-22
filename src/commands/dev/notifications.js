const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");

const userStats = require("../../schemas/stats");
const userDeaths = require("../../schemas/deaths");

module.exports = {
  name: "system",
  description: "send a system message to all users",
  deleted: false,
  options: [
    {
      name: "subject",
      description: "Set the subject of the message",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "body",
      description: "Set the body of the message",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  /**
   * @brief Allow developer to send messages to all Kirby Companion users
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    if (interaction.user.id != "407943427616145409") {
      interaction.reply("You do not have permission to use this command");
      return;
    }

    const subject = interaction.options.get("subject").value;
    let body = interaction.options.get("body").value;
    body = body.replace(/\\n/g, "\n");
    const pink = "#FF69B4";

    try {
      const embed = new EmbedBuilder()
        .setTitle(subject)
        .setColor(pink)
        .setDescription(body)
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp()
        .setFooter({
          text: `Developer Cozy`,
        });

      let userList = [];

      const allUsers = await userStats.find();
      if (!allUsers) {
        console.log("There are no active Kirbys!");
        return;
      }

      const allDeaths = await userDeaths.find();
      if (!allUsers) {
        console.log("There are no dead Kirbys!");
        return;
      }

      for (const user of allUsers) {
        userList.push(user.userId);
      }

      for (const user of allDeaths) {
        userList.push(user.userId);
      }

      userList = [...new Set(userList)];

      console.log(userList.length);

      for (const userId of userList) {
        try {
          const targetUser = await client.users.fetch(userId);
          if (targetUser) {
            const dmChannel = await targetUser.createDM();
            dmChannel
              .send({
                embeds: [embed],
                ephemeral: false,
              })
              .then((message) =>
                console.log(`Sent system message to ${targetUser.username}`)
              )
              .catch(console.error);
          }
        } catch (error) {
          console.error(`Error sending message to user: ${error}`);
        }
      }

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error sending system message: $${error}`);
    }
  },
};
