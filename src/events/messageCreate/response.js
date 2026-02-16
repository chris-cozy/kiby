const constructSentence = require("../../utils/constructSentence");
const playerRepository = require("../../repositories/playerRepository");

module.exports = async (client, message) => {
  if (message.author.bot) {
    return;
  }

  if (!message.mentions.has(client.user.id)) {
    return;
  }

  const player = await playerRepository.findByUserId(message.author.id);

  if (!player) {
    await message.reply(
      "You do not own a Kiby yet. Use `/adopt` to start your journey."
    );
    return;
  }

  try {
    await message.channel.sendTyping();
    await message.reply(`**${player.kirbyName}**: ${constructSentence()}`);
  } catch (error) {
    console.error(`Could not send Kiby response: ${error.message}`);
  }
};
