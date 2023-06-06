/**
 * @author Cozy
 * @version 3.9.1
 * @link discord.js.org/#/
 */
const dotenv = require('dotenv');
dotenv.config();
const { Client, IntentsBitField } = require('discord.js');
const { AutoPoster } = require('topgg-autoposter');
const eventHandler = require('./handlers/eventHandler');
const mongoose = require('mongoose');

// Intents: Information the bot needs to recieve
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

// Immediately invoked function made async to wait for database connection
(async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGO_CONNECTION, { keepAlive: true });
        console.log(`Connected to the mongo database.`);

        eventHandler(client);
        client.login(process.env.TOKEN);

        // Handle Top.GG
        const ap = AutoPoster(process.env.TOPGG_KEY, client);

        ap.on('posted', (stats) => {
            console.log(`Posted stats to top.gg! | ${stats.serverCount} servers`);
        });

        ap.on('error', (error) => {
            console.log(`There was an error posting stats to top.gg: ${error}`);
        })
    } catch (error) {
        console.log(`There was an error: ${error}`);
    }
})();