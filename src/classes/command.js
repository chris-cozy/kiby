const getMedia = require("../utils/getMedia");

class CommandContext {
  constructor(cooldownMins = 0) {
    this.milliConversion = 60 * 1000;
    this.cooldownMins = cooldownMins;
    this.interactionCooldown = cooldownMins * this.milliConversion;
    this.currentDate = new Date();
    this.pink = "#FF69B4";
    this.max = 100;
    this.zeroSpace = "\u200b";
  }

  async get_media_attachment(keyword = "info") {
    const media = await getMedia(keyword, { fallbackCategory: "info" });
    return {
      mediaString: `attachment://${media.name}`,
      mediaAttach: media.attachment,
    };
  }
}

module.exports = CommandContext;
