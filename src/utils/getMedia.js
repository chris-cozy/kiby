const { Client } = require('discord.js');
const media = require('../schemas/media');

/**
 * @brief Calculate a random number between the bounds
 * @param {Number} min 
 * @param {Number} max 
 * @return A number between the bounds
 */
function randon_num(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Grab a media based on the request
 * @param {Client} client 
 * @param {String} request 
 * @returns A media url
 */
module.exports = async (request) => {
    const keyword = request;

    let allMedia = await media.find({ type: keyword });

    const chosen = allMedia[randon_num(0, (allMedia.length - 1))];

    return chosen;
}