const { Schema, model } = require('mongoose');

/**
 * @brief Schema for user kirby statistics
 */
const datesSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    lastFeed: {
        type: Date,
        default: new Date(),
    },
    lastPet: {
        type: Date,
        default: new Date(),
    },
    lastPlay: {
        type: Date,
        default: new Date(),
    },
    lastSleep: {
        type: Date(),
    },
});

module.exports = model('userDates', datesSchema);