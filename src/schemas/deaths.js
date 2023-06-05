const { Schema, model } = require('mongoose');

/**
 * @brief Schema for user kirby graveyard statistics
 */
const deathSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    kirbyName: {
        type: String,
        required: true,
    },
    level: {
        type: Number,
        required: true,
    },
    adoptDate: {
        type: Date,
        required: true,
    },
    deathDate: {
        type: Date,
        required: true,
    }
});

module.exports = model('userDeaths', deathSchema);