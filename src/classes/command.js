const { AttachmentBuilder } = require('discord.js');
const getMedia = require('../utils/getMedia');

class command {

    constructor(cooldownMins = 0) {
        this.milliConversion = 60000;
        this.cooldownMins = cooldownMins;
        this.interactionCooldown = this.cooldownMins * this.milliConversion;
        this.currentDate = new Date();
        this.pink = '#FF69B4';
        this.sleepMins = 480;
        this.sleepTime = this.sleepMins * this.milliConversion;
        this.max = 100;
    }

    // Generate media file
    async get_media_attachment(keyword = 'portrait') {
        this.mediaFile = await getMedia(keyword);
        this.mediaAttach = new AttachmentBuilder(this.mediaFile.url);

        this.media = {
            mediaString: 'attachment://' + this.mediaFile.name,
            mediaAttach: this.mediaAttach,
        }

        return this.media;
    }

}

module.exports = command;