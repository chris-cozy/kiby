const { Schema, model } = require("mongoose");

const questEntrySchema = new Schema(
  {
    key: {
      type: String,
      default: "feed",
    },
    label: {
      type: String,
      default: "Use /feed",
    },
    category: {
      type: String,
      default: "care",
    },
    goal: {
      type: Number,
      default: 1,
      min: 1,
    },
    rewardCoins: {
      type: Number,
      default: 20,
      min: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

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
    streakShieldCharges: {
      type: Number,
      default: 1,
      min: 0,
      max: 1,
    },
    streakShieldLastGrantedAt: {
      type: Date,
      default: Date.now,
    },
    lastDailyClaimAt: {
      type: Date,
      default: null,
    },
    questBoard: {
      quests: {
        type: [questEntrySchema],
        default: [],
      },
      bonusQuest: {
        type: questEntrySchema,
        default: () => ({
          key: "none",
          label: "No bonus quest",
          category: "bonus",
          goal: 1,
          rewardCoins: 0,
          progress: 0,
          completed: false,
          claimedAt: null,
        }),
      },
      rerollsRemaining: {
        type: Number,
        default: 1,
        min: 0,
      },
      refreshedAt: {
        type: Date,
        default: Date.now,
      },
      dayKey: {
        type: String,
        default: "",
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
      cuddle: {
        type: Number,
        default: 0,
      },
      train: {
        type: Number,
        default: 0,
      },
      bathe: {
        type: Number,
        default: 0,
      },
      socialPlay: {
        type: Number,
        default: 0,
      },
      useItem: {
        type: Number,
        default: 0,
      },
      coinsGifted: {
        type: Number,
        default: 0,
      },
      itemsGifted: {
        type: Number,
        default: 0,
      },
      refreshedAt: {
        type: Date,
        default: Date.now,
      },
    },
    lifetime: {
      careActions: {
        type: Number,
        default: 0,
      },
      dailyClaims: {
        type: Number,
        default: 0,
      },
      questClaims: {
        type: Number,
        default: 0,
      },
      socialActions: {
        type: Number,
        default: 0,
      },
      adventuresCompleted: {
        type: Number,
        default: 0,
      },
      coinsGifted: {
        type: Number,
        default: 0,
      },
      itemsGifted: {
        type: Number,
        default: 0,
      },
      worldEventContributions: {
        type: Number,
        default: 0,
      },
    },
    titles: {
      unlocked: {
        type: [String],
        default: [],
      },
      equipped: {
        type: String,
        default: "",
      },
    },
    revive: {
      tokens: {
        type: Number,
        default: 1,
        min: 0,
      },
      totalRevives: {
        type: Number,
        default: 0,
      },
    },
    socialMemory: {
      dayKey: {
        type: String,
        default: "",
      },
      oneWayByTarget: {
        type: Map,
        of: Number,
        default: {},
      },
      lastTargetId: {
        type: String,
        default: "",
      },
      lastInteractedAt: {
        type: Date,
        default: null,
      },
    },
    ambient: {
      lastSentAt: {
        type: Date,
        default: null,
      },
    },
    globalEvents: {
      claimedEventIds: {
        type: [String],
        default: [],
      },
    },
  },
  { timestamps: true }
);

module.exports = model("PlayerProgress", playerProgressSchema);
