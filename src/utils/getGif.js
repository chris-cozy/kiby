const fetch = require("node-fetch");

/**
 * @brief Grab a gif from Tenor
 * @param {String} request 
 * @returns A gif link
 */
module.exports = async (request) => {
    const keyword = request;
    const url = `https://api.tenor.com/v1/search?q=${keyword}&key=${process.env.TENOR_KEY}&limit=10`;

    const response = await fetch(url);
    const result = await response.json();
    const index = Math.floor(Math.random() * result.results.length);
    let gifUrl = result.results[index].media[0].gif.url;
    return gifUrl;
}