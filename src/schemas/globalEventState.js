const { Schema, model } = require("mongoose");

const globalEventStateSchema = new Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endsAt: {
      type: Date,
      required: true,
      index: true,
    },
    goal: {
      type: Number,
      required: true,
      min: 1,
    },
    progress: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    announcedCompletion: {
      type: Boolean,
      default: false,
    },
    contributions: {
      type: Map,
      of: Number,
      default: {},
    },
    claims: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = model("GlobalEventState", globalEventStateSchema);
