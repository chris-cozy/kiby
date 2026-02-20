const { Schema, model } = require("mongoose");

const globalEventCycleStateSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: "global",
    },
    nextEligibleAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    lastRollAt: {
      type: Date,
      default: null,
    },
    lastStartedAt: {
      type: Date,
      default: null,
    },
    lastEndedAt: {
      type: Date,
      default: null,
    },
    lastEventId: {
      type: String,
      default: "",
    },
    lastDurationHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastIdleGapHours: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = model("GlobalEventCycleState", globalEventCycleStateSchema);
