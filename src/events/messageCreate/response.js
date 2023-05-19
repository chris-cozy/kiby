const { Client, Message } = require('discord.js');
const construct_sentence = require("../../utils/constructSentence");
const userStats = require('../../schemas/stats');

/**
 * @brief Handle a message sent in the server. Upon being mentioned, respond with random combination of kirby language
 * @param {Client} client - The bot
 * @param {Message} message - The message which was sent
 */
module.exports = async (client, message) => {
    // Ignore message if author is a bot, or if the bot is not mentioned
    if (message.author.bot || (!message.mentions.has(client.user.id))) {
        return;
    }

    let userKirby = await userStats.findOne({ userId: message.author.id });

    if (userKirby) {
        const kirbyName = userKirby.kirbyName;

        // Give the illusion of bot typing
        await message.channel.sendTyping();

        const response = construct_sentence();

        message.reply(`**${kirbyName}**: ` + response);

    } else {
        message.reply(`You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey.`);
        return;
    }


};