const { EmbedBuilder } = require('discord.js');
const randomNumber = require("../../utils/randomNumber");

/**
 * Handle a message sent in the server. 
 * Upon being mentioned, respond with random combination of kirby language
 * @param {*} client - The bot
 * @param {object} message - The message which was sent
 */
module.exports = async (client, message) => {
    // Ignore msg if author is a bot
    if (message.author.bot) {
        return;
    }

    // Send alert if not sent in the right channel
    if (message.channel.id !== process.env.OPENAI_CHANNEL_ID) {
        console.log('not the designated channel');
    }

    // Ignore message if bot is not mentioned
    if (!message.mentions.has(client.user.id)) {
        return;
    }

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
        const sentenceLength = randomNumber(0, maxSentenceLength);

        // Cycle through and construct each word
        for (let i = 0; i < sentenceLength; i++) {

            const wordLength = randomNumber(minWordLength, maxWordLength);

            for (let k = 0; k < wordLength; k++) {
                const index = Math.floor(Math.random() * lexigraph.length);
                response += lexigraph[index];
            }

            response += ' ';
        }

        const punctuationIndex = Math.floor(Math.random() * punctuation.length);
        response += punctuation[punctuationIndex];
    }

    message.reply(response);
};