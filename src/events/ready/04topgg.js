const { Client } = require('discord.js');
const { AutoPoster } = require('topgg-autoposter');

/**
 * @brief Periodically update topgg with the bot's stats
 * @param {Client} client
 */
module.exports = (client) => {

    const topggUpdateTimer = 0.5 * milliConversion;

    setInterval(async () => {

        const ap = AutoPoster(process.env.TOPGG_KEY, client);

        ap.on('posted', () => {
            console.log('Posted stats to top.gg!');
        });

        ap.on('error', () => {
            console.log('There was an error posting stats to top.gg!');
        })

    }, topggUpdateTimer);
};