const GlobalEventCycleState = require("../schemas/globalEventCycleState");

async function getSingleton() {
  return GlobalEventCycleState.findOneAndUpdate(
    { key: "global" },
    {
      $setOnInsert: {
        key: "global",
        nextEligibleAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function saveCycleState(cycleState) {
  return cycleState.save();
}

module.exports = {
  getSingleton,
  saveCycleState,
};
