const { Schema, model } = require("mongoose");

const seasonStateSchema = new Schema(
  {
    scope: {
      type: String,
      required: true,
      unique: true,
      default: "global",
    },
    currentSeasonKey: {
      type: String,
      required: true,
      default: "",
    },
    seasonLengthDays: {
      type: Number,
      required: true,
      enum: [7, 14],
      default: 7,
    },
    currentStartAt: {
      type: Date,
      default: null,
    },
    currentEndAt: {
      type: Date,
      default: null,
    },
    lastSnapshottedSeasonKey: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = model("SeasonState", seasonStateSchema);
