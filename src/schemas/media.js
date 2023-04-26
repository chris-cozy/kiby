const { Schema, model } = require('mongoose');

/**
 * @brief Schema for kirby media
 */
const media = new Schema({
    type: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
});

module.exports = model('media', media);