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
    social: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
      max: 100,
    },
    battlePower: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1000,
    },
    battlePowerUpdatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    socialOptIn: {
      type: Boolean,
      default: false,
    },
    ambientOptIn: {
      type: Boolean,
      default: true,
    },
    adoptedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastPlaydateAt: {
      type: Date,
      default: null,
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
      cuddle: {
        type: Date,
        default: Date.now,
      },
      train: {
        type: Date,
        default: Date.now,
      },
      bathe: {
        type: Date,
        default: Date.now,
      },
      socialPlay: {
        type: Date,
        default: Date.now,
      },
      socialReceived: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

module.exports = model("PlayerProfile", playerProfileSchema);
