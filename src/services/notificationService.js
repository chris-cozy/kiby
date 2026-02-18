const { EmbedBuilder } = require("discord.js");
const getMedia = require("../utils/getMedia");
const logger = require("../utils/logger");
const languageService = require("./languageService");

async function sendDirectMessage(client, userId, payload) {
  try {
    const user = await client.users.fetch(userId);
    if (!user) {
      logger.warn("Could not locate Discord user for DM", { userId });
      return false;
    }

    const dm = await user.createDM();
    await dm.send(payload);
    return true;
  } catch (error) {
    logger.warn("Failed to send DM", {
      userId,
      error: error.message,
    });
    return false;
  }
}

async function buildNotificationEmbed(client, title, description, mediaKeyword) {
  const media = await getMedia(mediaKeyword);
  const attachmentName = media.name;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor("#FF69B4")
    .setDescription(description)
    .setImage(`attachment://${attachmentName}`)
    .setTimestamp()
    .setFooter({
      text: client.user.username,
      iconURL: client.user.displayAvatarURL(),
    });

  return {
    embed,
    attachment: media.attachment,
  };
}

async function sendNeedNotification(client, type, userId, kirbyName) {
  const map = {
    hunger: {
      title: "HUNGRY",
      description: `**${kirbyName}** is hungry and needs food soon.`,
      media: "hungry",
    },
    affection: {
      title: "AFFECTION",
      description: `**${kirbyName}** wants some attention and care.`,
      media: "affection",
    },
    social: {
      title: "SOCIAL",
      description: `**${kirbyName}** is feeling lonely and needs social play.`,
      media: "affection",
    },
    death: {
      title: "DEATH",
      description: `**${kirbyName}** has died from neglect. You can adopt again anytime.`,
      media: "death",
    },
  };

  const entry = map[type];
  if (!entry) {
    return false;
  }

  const payload = await buildNotificationEmbed(
    client,
    entry.title,
    entry.description,
    entry.media
  );

  return sendDirectMessage(client, userId, {
    embeds: [payload.embed],
    files: [payload.attachment],
  });
}

async function sendWorldEventNotification(client, userId, kirbyName, worldEvent) {
  const title = `WORLD EVENT: ${worldEvent.title}`;
  const changes = Object.entries(worldEvent.delta || {})
    .map(([key, value]) => `${key}: ${value >= 0 ? "+" : ""}${value}`)
    .join(", ");
  const flavor = await languageService.buildWorldEventLineForUser(userId, new Date());
  const description = `**${kirbyName}** was affected by **${worldEvent.description}**${
    changes ? `\n\nImpact: ${changes}` : ""
  }\n\n${kirbyName}: ${flavor}`;

  const payload = await buildNotificationEmbed(
    client,
    title,
    description,
    "portrait"
  );

  return sendDirectMessage(client, userId, {
    embeds: [payload.embed],
    files: [payload.attachment],
  });
}

async function sendAmbientBehaviorNotification(
  client,
  userId,
  kirbyName,
  mood,
  phrase
) {
  const title = `Kiby Moment (${mood})`;
  const description = `**${kirbyName}** ${phrase}`;
  const payload = await buildNotificationEmbed(client, title, description, "portrait");

  return sendDirectMessage(client, userId, {
    embeds: [payload.embed],
    files: [payload.attachment],
  });
}

async function sendGlobalEventCompletionNotification(client, userId, event) {
  const title = `GLOBAL EVENT COMPLETE: ${event.title}`;
  const flavor = await languageService.buildGlobalEventLineForUser(userId, new Date());
  const description = `Dream Land reached the goal for **${event.title}**. Use \`/events claim\` to collect your reward if you contributed.\n\nKiby Signal: ${flavor}`;
  const payload = await buildNotificationEmbed(client, title, description, "portrait");
  return sendDirectMessage(client, userId, {
    embeds: [payload.embed],
    files: [payload.attachment],
  });
}

async function sendGlobalEventStartNotification(client, userId, event) {
  const title = `GLOBAL EVENT STARTED: ${event.title}`;
  const flavor = await languageService.buildGlobalEventLineForUser(userId, new Date());
  const description = `A new global event has begun.\n\n**${event.title}**\n${event.description}\n\nGoal: **${event.goal}** by **${new Date(
    event.endsAt
  ).toLocaleString("en-US")}**.\nUse \`/events view\` to check progress.\n\nKiby Signal: ${flavor}`;
  const payload = await buildNotificationEmbed(client, title, description, "portrait");
  return sendDirectMessage(client, userId, {
    embeds: [payload.embed],
    files: [payload.attachment],
  });
}

async function sendAdventureReadyNotification(client, userId, payloadData) {
  const title =
    payloadData.status === "failed" ? "Adventure Ended Early" : "Adventure Complete";
  const description =
    payloadData.status === "failed"
      ? `**${payloadData.routeLabel}** ended in failure. Use \`/adventure claim\` to resolve and recover your Kiby.`
      : `**${payloadData.routeLabel}** is ready to claim. Use \`/adventure claim\` to collect rewards.`;

  if (payloadData.routeImageUrl) {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor("#FF69B4")
      .setDescription(description)
      .setImage(payloadData.routeImageUrl)
      .setTimestamp()
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL(),
      });

    return sendDirectMessage(client, userId, {
      embeds: [embed],
    });
  }

  const payload = await buildNotificationEmbed(client, title, description, "portrait");
  return sendDirectMessage(client, userId, {
    embeds: [payload.embed],
    files: [payload.attachment],
  });
}

async function sendGiftReceivedNotification(client, userId, gift) {
  const title = "Gift Received";
  const description =
    gift.type === "coins"
      ? `You received **${gift.amount} Star Coins** from **${gift.senderName}**.`
      : `You received **${gift.quantity}x ${gift.itemLabel}** from **${gift.senderName}**.`;
  const payload = await buildNotificationEmbed(client, title, description, "portrait");
  return sendDirectMessage(client, userId, {
    embeds: [payload.embed],
    files: [payload.attachment],
  });
}

async function sendSocialInteractionReceivedNotification(client, userId, payloadData) {
  const title = "Kiby Social Visit";
  const description = `**${payloadData.senderName}** used **${payloadData.action}** on your Kiby.\n\nYour Kiby gains:\n- Affection: **+${payloadData.targetAffectionGain}**\n- Social: **+${payloadData.targetSocialGain}**`;
  const payload = await buildNotificationEmbed(client, title, description, "affection");
  return sendDirectMessage(client, userId, {
    embeds: [payload.embed],
    files: [payload.attachment],
  });
}

module.exports = {
  sendAdventureReadyNotification,
  sendAmbientBehaviorNotification,
  sendDirectMessage,
  sendGiftReceivedNotification,
  sendGlobalEventStartNotification,
  sendGlobalEventCompletionNotification,
  sendNeedNotification,
  sendSocialInteractionReceivedNotification,
  sendWorldEventNotification,
};
