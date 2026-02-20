const { Schema, model } = require("mongoose");

const deathHistorySchema = new Schema(
  {
    entityType: {
      type: String,
      required: true,
      enum: ["player", "npc"],
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
      min: 1,
    },
    adoptedAt: {
      type: Date,
      required: true,
    },
    deathAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    reason: {
      type: String,
      default: "neglect",
    },
  },
  { timestamps: true }
);

module.exports = model("DeathHistory", deathHistorySchema);
