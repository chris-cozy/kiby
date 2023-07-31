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

  // Check if the message is sent in a server or DMs
  const isDM = message.channel.type === "DM";

  // Ignore message if the bot is not mentioned in a server or a DM
  if (!isDM && !message.mentions.has(client.user.id)) {
    return;
  }

  let userKirby;

  if (isDM) {
    userKirby = await userStats.findOne({ userId: message.author.id });

    if (!userKirby) {
      message.reply(
        `You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey.`
      );
      return;
    }
    console.log("DM");
  } else {
    userKirby = await userStats.findOne({ userId: message.author.id });

    if (!userKirby) {
      message.reply(
        `You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey.`
      );
      return;
    }
  }

  const kirbyName = userKirby.kirbyName;

  // Give the illusion of bot typing
  try {
    await message.channel.sendTyping();

    const response = construct_sentence();

    message.reply(`**${kirbyName}**: ` + response);
  } catch (error) {
    print(`Could not send Kirby message reply due to error: ${error}`);
  }
};
