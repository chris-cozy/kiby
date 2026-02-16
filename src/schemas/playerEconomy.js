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
  },
  { timestamps: true }
);

module.exports = model("PlayerEconomy", playerEconomySchema);
