const SeasonState = require("../schemas/seasonState");

async function getGlobalState() {
  return SeasonState.findOneAndUpdate(
    { scope: "global" },
    {
      $setOnInsert: {
        scope: "global",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function saveState(state) {
  return state.save();
}

module.exports = {
  getGlobalState,
  saveState,
};
