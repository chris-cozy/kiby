const media = require('../schemas/media');
const randomNumber = require('./randomNumber');

/**
 * @brief Grab a media based on the request
 * @param {String} request 
 * @returns A media url
 */
module.exports = async (request) => {
    const keyword = request;

    let allMedia = await media.find({ type: keyword });

    const chosen = allMedia[randomNumber(0, (allMedia.length - 1))];

    return chosen;
}