# Kiby (discord.js)
## Description
This is a discord bot created using the discord.js library, as well as other capatible libraries. The purpose of this bot is to function as a digital tomagatchi, which users can take care of to maintain its life.
Users feed, pet, and play with their Kirby to keep it happy and healthy. If they neglect their Kirby it will slowly lose hunger and affection points. If either hunger and affection reach 0, then the Kirby's health will begin to decrease over time. If the Kirby's health reaches 0 then the Kirby will die.
### Future Implications
Coming soon is a slight overhaul and battle system, allowing users to battle other Kirby owners in pokemon-style, turn-based combat to gain battle stars and climb the BattleBoard.

## Features
### Conversation
This bot has a detailed Kirby phonetic system, which was compiled by studying instances of Kirby speaking. The user's Kirby can be conversed with by the user prefixing their message with a bot mention.
### Config Commands
- /adopt - Adopt and name a Kirby
### Care Commands
- /feed - Feed your Kirby. This can be done once every 30 minutes. Grants hunger points.
- /pet - Pet your Kirby. This can be done once every 5 minutes. Grants affection points.
- /play - Play with your Kirby. This can be done once 10 minutes. Grants affection points.
- /sleep - Put your Kirby to sleep for 8 hours. While asleep, Kirby will not need affection or food, and only petting can be done. This can be done once a day.
### Miscellaneous Commands
- /info - Display current stats on your Kirby
- /leaderboard - Display the top ten Kirbys
- /cooldowns - Display any current cooldowns on Kirby interactions
- /ping - Show the bot's client and websocket ping
## Prerequisites
Node.js

## Installation and Use
1. Download the code base.
2. Open a terminal in the main directory
3. Run the command: `npx nodemon index.js`
## Contributing
Issue Tracker: [discord-bot-js/issues](https://github.com/chris-cozy/discord-bot-js/issues "Issue tracker for the discord bot")
## License
Currently Not Applicable
## Citation
Currently Not Applicable
## Contact
For more information, contact <csande9@clemson.edu>