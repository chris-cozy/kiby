const { Schema, model } = require("mongoose");

const playerProgressSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    dailyStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastDailyClaimAt: {
      type: Date,
      default: null,
    },
    quest: {
      key: {
        type: String,
        default: "feed",
      },
      goal: {
        type: Number,
        default: 3,
      },
      rewardCoins: {
        type: Number,
        default: 25,
      },
      progress: {
        type: Number,
        default: 0,
      },
      completed: {
        type: Boolean,
        default: false,
      },
      claimedAt: {
        type: Date,
        default: null,
      },
      refreshedAt: {
        type: Date,
        default: Date.now,
      },
    },
    dailyActionCounts: {
      feed: {
        type: Number,
        default: 0,
      },
      pet: {
        type: Number,
        default: 0,
      },
      play: {
        type: Number,
        default: 0,
      },
      refreshedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  { timestamps: true }
);

module.exports = model("PlayerProgress", playerProgressSchema);
