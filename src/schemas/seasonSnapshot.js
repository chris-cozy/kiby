const { Schema, model } = require("mongoose");

const seasonSnapshotRowSchema = new Schema(
  {
    rank: {
      type: Number,
      required: true,
      min: 1,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["player", "npc"],
    },
    entityId: {
      type: String,
      required: true,
    },
    kirbyName: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      required: true,
      min: 1,
    },
    xp: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const seasonSnapshotSchema = new Schema(
  {
    seasonKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    seasonLengthDays: {
      type: Number,
      required: true,
      enum: [7, 14],
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    rows: {
      type: [seasonSnapshotRowSchema],
      default: [],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = model("SeasonSnapshot", seasonSnapshotSchema);
