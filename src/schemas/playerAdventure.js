const { Schema, model } = require("mongoose");

const adventureCheckpointSchema = new Schema(
  {
    minuteMark: {
      type: Number,
      required: true,
      min: 1,
    },
    damage: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const adventureRunSchema = new Schema(
  {
    routeId: {
      type: String,
      required: true,
    },
    routeLabel: {
      type: String,
      required: true,
    },
    baselineDurationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    earliestResolveAt: {
      type: Date,
      required: true,
    },
    latestResolveAt: {
      type: Date,
      required: true,
    },
    resolvedAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "failed", "completed"],
      default: "active",
    },
    seed: {
      type: Number,
      required: true,
    },
    preparednessScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    riskBand: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High"],
    },
    supportItemId: {
      type: String,
      default: "",
    },
    supportItemLabel: {
      type: String,
      default: "",
    },
    hpAtStart: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    failThresholdHp: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
    },
    failureAt: {
      type: Date,
      default: null,
    },
    checkpoints: {
      type: [adventureCheckpointSchema],
      default: [],
    },
    totalDamage: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardCoins: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardXp: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardItems: {
      type: Map,
      of: Number,
      default: {},
    },
    completionNotifiedAt: {
      type: Date,
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const adventureHistorySchema = new Schema(
  {
    routeId: {
      type: String,
      required: true,
    },
    routeLabel: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["failed", "completed"],
    },
    startedAt: {
      type: Date,
      required: true,
    },
    resolvedAt: {
      type: Date,
      required: true,
    },
    rewardCoins: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardXp: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDamage: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const playerAdventureSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    activeRun: {
      type: adventureRunSchema,
      default: null,
    },
    history: {
      type: [adventureHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = model("PlayerAdventure", playerAdventureSchema);
