const { Schema, model } = require("mongoose");

const playerProfileSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    kirbyName: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    xp: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    hp: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
      max: 100,
    },
    hunger: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
      max: 100,
    },
    affection: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
      max: 100,
    },
    adoptedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastCare: {
      feed: {
        type: Date,
        default: Date.now,
      },
      pet: {
        type: Date,
        default: Date.now,
      },
      play: {
        type: Date,
        default: Date.now,
      },
    },
  },
  { timestamps: true }
);

module.exports = model("PlayerProfile", playerProfileSchema);
