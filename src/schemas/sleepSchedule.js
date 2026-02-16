const { Schema, model } = require("mongoose");

const sleepScheduleSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timezone: {
      type: String,
      required: true,
    },
    startMinuteLocal: {
      type: Number,
      required: true,
      min: 0,
      max: 1439,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 60,
      max: 540,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = model("SleepSchedule", sleepScheduleSchema);
