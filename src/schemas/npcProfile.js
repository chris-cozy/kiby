const { Schema, model } = require("mongoose");

const npcProfileSchema = new Schema(
  {
    npcId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    kirbyName: {
      type: String,
      required: true,
    },
    tier: {
      type: String,
      required: true,
      enum: ["casual", "active", "competitive"],
    },
    behaviorSeed: {
      type: Number,
      required: true,
      default: 1,
    },
    careStyle: {
      type: String,
      required: true,
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
      default: 90,
      min: 0,
      max: 100,
    },
    affection: {
      type: Number,
      required: true,
      default: 90,
      min: 0,
      max: 100,
    },
    adoptedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastSimulatedAt: {
      type: Date,
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

module.exports = model("NpcProfile", npcProfileSchema);
