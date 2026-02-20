const { Schema, model } = require("mongoose");

const seasonEntrySchema = new Schema(
  {
    seasonKey: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["player", "npc"],
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      default: "",
      index: true,
    },
    npcId: {
      type: String,
      default: "",
      index: true,
    },
    kirbyName: {
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
    updatedAtSeason: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

seasonEntrySchema.index(
  { seasonKey: 1, entityType: 1, entityId: 1 },
  { unique: true }
);

module.exports = model("SeasonEntry", seasonEntrySchema);
