const { Schema, model } = require("mongoose");

const playerEconomySchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    starCoins: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
    },
    inventory: {
      type: Map,
      of: Number,
      default: {},
    },
    lastToyUse: {
      type: Map,
      of: Date,
      default: {},
    },
    gifting: {
      dayKey: {
        type: String,
        default: "",
      },
      coinsSent: {
        type: Number,
        default: 0,
      },
      itemsSent: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

module.exports = model("PlayerEconomy", playerEconomySchema);
