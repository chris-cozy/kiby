const playerRepository = require("../../repositories/playerRepository");
const sleepService = require("../../services/sleepService");
const { buildConversationLine } = require("../../services/dialogueService");

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
    const schedule = await sleepService.getScheduleForUser(message.author.id);
    const sleeping = sleepService.isSleepingNow(schedule, new Date());
    const line = await buildConversationLine(
      message.author.id,
      player,
      { sleeping },
      new Date()
    );

    await message.channel.sendTyping();
    await message.reply(`**${player.kirbyName}**: ${line}`);
  } catch (error) {
    console.error(`Could not send Kiby response: ${error.message}`);
  }
};
