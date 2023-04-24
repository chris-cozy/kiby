const { Schema, model } = require('mongoose');

/**
 * Database schema for user kirby statistics
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
    lastAffection: {
        type: Date,
        default: new Date(),
    },
});

module.exports = model('userDates', datesSchema);