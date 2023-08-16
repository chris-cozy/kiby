const { Client, Message } = require("discord.js");
const construct_sentence = require("../../utils/constructSentence");
const userStats = require("../../schemas/stats");

/**
 * @brief Handle a message sent in the server. Upon being mentioned, respond with random combination of kirby language
 * @param {Client} client - The bot
 * @param {Message} message - The message which was sent
 */
module.exports = async (client, message) => {
  // Ignore message if author is a bot
  if (message.author.bot) {
    return;
  }

  if (message.mentions.has(client.user.id)) {
    const userKirby = await userStats.findOne({ userId: message.author.id });

    if (!userKirby) {
      message.reply(
        `You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey.`
      );
      return;
    }

    // Give the illusion of bot typing
    try {
      await message.channel.sendTyping();

      const kirbyName = userKirby.kirbyName;
      const response = construct_sentence();

      message.reply(`**${kirbyName}**: ` + response);
    } catch (error) {
      console.error(
        `Could not send Kirby message reply due to error: ${error}`
      );
    }
  }
};
