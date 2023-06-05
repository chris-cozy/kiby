const random_number = require("./randomNumber");

/**
 * @brief Construct a random sentence using the kirby lexicon
 * @returns A sentence
 */
module.exports = () => {

    const maxWordLength = 3;
    const maxSentenceLength = 3;
    const minWordLength = 1;
    const minSentenceLength = 0;
    const lexicon = [
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

    const punctuation = ['?', '!', '.', '']

    let response = '';


    const sentenceLength = random_number(minSentenceLength, maxSentenceLength);

    // Cycle through and construct each word
    for (let i = 0; i < sentenceLength; i++) {

        const wordLength = random_number(minWordLength, maxWordLength);

        for (let k = 0; k < wordLength; k++) {
            const index = Math.floor(Math.random() * lexicon.length);
            response += lexicon[index];
        }

        response += ' ';
    }

    const punctuationIndex = Math.floor(Math.random() * punctuation.length);
    response += punctuation[punctuationIndex];

    return response;
};