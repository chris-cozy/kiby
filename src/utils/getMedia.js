const random_number = require('./randomNumber');
const path = require('path');
const get_all_files = require('./getAllFiles');

/**
 * @brief Grab a media based on the request
 * @param {String} request 
 * @returns A media url
 */
module.exports = async (request) => {
    const keyword = request;

    let mediaSelection = []

    // Grab all subdirs of media directory
    const mediaCategories = get_all_files(
        path.join(__dirname, '..', 'media'),
        true
    )
    console.log(mediaCategories);

    for (const mediaCategory of mediaCategories) {
        if (mediaCategory.substring(mediaCategory.lastIndexOf("\\") + 1) == keyword) {
            const mediaFiles = get_all_files(mediaCategory);

            for (const mediaFile of mediaFiles) {
                mediaSelection.push(mediaFile);
            }
        } else {
            continue;
        }

    }
    console.log(mediaSelection);

    const chosen = mediaSelection[random_number(0, (mediaSelection.length - 1))];

    const media = {
        name: chosen.substring(chosen.lastIndexOf("\\") + 1),
        url: chosen,
    }
    console.log(media);
    return media;
}