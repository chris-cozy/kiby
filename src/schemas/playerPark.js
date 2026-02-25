const { Schema, model } = require("mongoose");

const parkSessionSchema = new Schema(
  {
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    resolvedAt: {
      type: Date,
      required: true,
    },
    plannedSocialGain: {
      type: Number,
      required: true,
      min: 0,
    },
    plannedHungerLoss: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const parkHistorySchema = new Schema(
  {
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    elapsedMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    completed: {
      type: Boolean,
      required: true,
      default: false,
    },
    socialGain: {
      type: Number,
      required: true,
      min: 0,
    },
    hungerLoss: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const playerParkSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    activeSession: {
      type: parkSessionSchema,
      default: null,
    },
    history: {
      type: [parkHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = model("PlayerPark", playerParkSchema);
