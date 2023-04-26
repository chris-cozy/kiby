const { Schema, model } = require('mongoose');

/**
 * @brief Schema for user kirby statistics
 */
const statsSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    kirbyName: {
        type: String,
        required: true,
    },
    xp: {
        type: Number,
        required: true,
        default: 0,
    },
    level: {
        type: Number,
        required: true,
        default: 1,
    },
    hp: {
        type: Number,
        required: true,
        default: 100,
    },
    hunger: {
        type: Number,
        required: true,
        default: 100,
    },
    affection: {
        type: Number,
        required: true,
        default: 100,
    },
    adoptDate: {
        type: Date,
        required: true,
    },
});

module.exports = model('userStats', statsSchema);