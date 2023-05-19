const { Client, Message } = require('discord.js');
const random_number = require("../../utils/randomNumber");
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

        // Give the illusion of the bot typing
        await message.channel.sendTyping();

        const maxWordLength = 3;
        const maxSentenceLength = 3;
        const minWordLength = 1;
        const minSentenceLength = 1;
        const lexigraph = [
            'yo',
            'oy',
            'pu',
            'pa',
            'ga',
            'bu',
            'lo',
            'la',
            'ha',
            'ya',
            'by',
            'wu',
        ];

        const punctuation = [
            '?',
            '!',
            '.',
            '',
        ]

        let response = '';

        while (response == '') {

            // Return random length between 0 and the maximum word length for sentence
            const sentenceLength = random_number(0, maxSentenceLength);

            // Cycle through and construct each word
            for (let i = 0; i < sentenceLength; i++) {

                const wordLength = random_number(minWordLength, maxWordLength);

                for (let k = 0; k < wordLength; k++) {
                    const index = Math.floor(Math.random() * lexigraph.length);
                    response += lexigraph[index];
                }

                response += ' ';
            }

            const punctuationIndex = Math.floor(Math.random() * punctuation.length);
            response += punctuation[punctuationIndex];
        }

        message.reply(`**${kirbyName}**: ` + response);

    } else {
        message.reply(`You don't yet own a Kirby! Use command **/adopt** to start your Kirby journey.`);
        return;
    }


};