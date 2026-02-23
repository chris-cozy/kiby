const {
  ApplicationCommandOptionType,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");
const env = require("../../config/env");
const playerRepository = require("../../repositories/playerRepository");
const playerProgressRepository = require("../../repositories/playerProgressRepository");
const notificationService = require("../../services/notificationService");
const { safeDefer, safeReply } = require("../../utils/interactionReply");
const logger = require("../../utils/logger");

const MODE_ACTIVE_72H = "active_72h";
const MODE_ALL_INSTALLED = "all_installed";
const ACTIVE_WINDOW_HOURS = 72;

async function listGuildBroadcastChannels(guild) {
  const ordered = [];
  const seen = new Set();

  const addCandidate = (channel) => {
    if (!channel || seen.has(channel.id)) {
      return;
    }
    if (!channel.isTextBased?.() || channel.isDMBased?.()) {
      return;
    }
    seen.add(channel.id);
    ordered.push(channel);
  };

  addCandidate(guild.systemChannel);
  addCandidate(guild.publicUpdatesChannel);

  const guildChannels = await guild.channels.fetch();
  for (const channel of guildChannels.values()) {
    if (!channel) {
      continue;
    }

    if (
      channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildAnnouncement
    ) {
      continue;
    }

    addCandidate(channel);
  }

  return ordered;
}

async function listTargetPlayerIds(mode) {
  if (mode === MODE_ACTIVE_72H) {
    const since = new Date(Date.now() - ACTIVE_WINDOW_HOURS * 60 * 60 * 1000);
    const rows = await playerProgressRepository.listActiveSince(since);
    return Array.from(
      new Set(rows.map((row) => row.userId).filter((userId) => Boolean(userId)))
    );
  }

  const players = await playerRepository.listAllPlayers();
  return Array.from(
    new Set(players.map((player) => player.userId).filter((userId) => Boolean(userId)))
  );
}

function buildSystemReportEmbed({
  mode,
  subject,
  body,
  requestedBy,
  playerSent,
  playerTargeted,
  serverSent,
  serverTargeted,
  installedServerCount,
}) {
  const bodyPreview = body.length > 400 ? `${body.slice(0, 397)}...` : body;

  const embed = new EmbedBuilder()
    .setTitle("System Delivery Report")
    .setColor("#FF69B4")
    .setDescription(`Subject: **${subject}**`)
    .addFields(
      {
        name: "Mode",
        value: `\`${mode}\``,
        inline: true,
      },
      {
        name: "Requested By",
        value: requestedBy,
        inline: true,
      },
      {
        name: "Player DMs",
        value: `${playerSent}/${playerTargeted}`,
        inline: true,
      },
      {
        name: "Body Preview",
        value: bodyPreview || "(empty)",
        inline: false,
      }
    )
    .setTimestamp();

  if (mode === MODE_ALL_INSTALLED) {
    embed.addFields({
      name: "Server Messages",
      value: `${serverSent}/${serverTargeted} servers with candidate channels (${installedServerCount} installed servers)`,
      inline: false,
    });
  }

  return embed;
}

module.exports = {
  name: "system",
  description: "Send a system message by audience mode.",
  deleted: false,
  devOnly: true,
  options: [
    {
      name: "mode",
      description: "Audience mode",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Active players (past 72h)",
          value: MODE_ACTIVE_72H,
        },
        {
          name: "All installs (players + servers)",
          value: MODE_ALL_INSTALLED,
        },
      ],
    },
    {
      name: "subject",
      description: "Message subject",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "body",
      description: "Message body",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    await safeDefer(interaction, { ephemeral: true });

    if (!env.devUserIds.includes(interaction.user.id)) {
      await safeReply(interaction, {
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
      return;
    }

    const mode = interaction.options.getString("mode", true);
    const subject = interaction.options.getString("subject", true);
    const body = interaction.options.getString("body", true).replace(/\\n/g, "\n");

    const embed = new EmbedBuilder()
      .setTitle(subject)
      .setColor("#FF69B4")
      .setDescription(body)
      .setFooter({ text: "Kiby System" })
      .setTimestamp();

    const playerIds = await listTargetPlayerIds(mode);
    let playerSent = 0;

    for (const userId of playerIds) {
      try {
        const user = await client.users.fetch(userId);
        if (!user) {
          continue;
        }

        const dm = await user.createDM();
        await dm.send({ embeds: [embed] });
        playerSent += 1;
      } catch (error) {
        logger.warn("Failed to send system message", {
          userId,
          error: error.message,
        });
      }
    }

    let serverSent = 0;
    let serverTargeted = 0;
    const installedServerCount = client.guilds.cache.size;

    if (mode === MODE_ALL_INSTALLED) {
      for (const guild of client.guilds.cache.values()) {
        try {
          const channels = await listGuildBroadcastChannels(guild);
          if (!channels.length) {
            continue;
          }

          serverTargeted += 1;
          let delivered = false;
          for (const channel of channels) {
            try {
              await channel.send({ embeds: [embed] });
              serverSent += 1;
              delivered = true;
              break;
            } catch (error) {
              logger.warn("Failed to send system message to channel", {
                guildId: guild.id,
                channelId: channel.id,
                error: error.message,
              });
            }
          }

          if (!delivered) {
            logger.warn("Failed to send system message to any channel", {
              guildId: guild.id,
              attemptedChannels: channels.length,
            });
          }
        } catch (error) {
          logger.warn("Failed to send system message to server", {
            guildId: guild.id,
            error: error.message,
          });
        }
      }
    }

    const lines = [
      `Mode: \`${mode}\``,
      `Player DMs delivered: ${playerSent}/${playerIds.length}.`,
    ];

    if (mode === MODE_ALL_INSTALLED) {
      lines.push(
        `Server messages delivered: ${serverSent}/${serverTargeted} servers with candidate channels (${installedServerCount} installed servers).`
      );
    }

    const reportEmbed = buildSystemReportEmbed({
      mode,
      subject,
      body,
      requestedBy: `${interaction.user.id}`,
      playerSent,
      playerTargeted: playerIds.length,
      serverSent,
      serverTargeted,
      installedServerCount,
    });

    const developerUserIds = Array.from(
      new Set(env.devUserIds.filter((userId) => Boolean(userId)))
    );
    let developerReportsSent = 0;

    for (const userId of developerUserIds) {
      const ok = await notificationService.sendDirectMessage(client, userId, {
        embeds: [reportEmbed],
      });

      if (ok) {
        developerReportsSent += 1;
      } else {
        logger.warn("Failed to send system delivery report to developer", {
          userId,
          mode,
          subject,
        });
      }
    }

    lines.push(
      `Developer reports delivered: ${developerReportsSent}/${developerUserIds.length}.`
    );

    await safeReply(interaction, {
      content: lines.join("\n"),
      ephemeral: true,
    });
  },
};
