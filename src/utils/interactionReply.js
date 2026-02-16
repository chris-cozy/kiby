async function safeReply(interaction, payload) {
  const inGuild =
    typeof interaction.inGuild === "function" ? interaction.inGuild() : false;

  if (interaction.deferred || interaction.replied) {
    if (typeof payload === "object" && payload !== null) {
      const { ephemeral: _ephemeral, ...restPayload } = payload;
      const editPayload = inGuild ? restPayload : { ...restPayload };
      return interaction.editReply(editPayload);
    }

    return interaction.editReply(payload);
  }

  if (typeof payload === "object" && payload !== null && !inGuild) {
    const { ephemeral: _ephemeral, ...replyPayload } = payload;
    return interaction.reply(replyPayload);
  }

  return interaction.reply(payload);
}

async function safeDefer(interaction, options) {
  if (interaction.deferred || interaction.replied) {
    return;
  }

  const inGuild =
    typeof interaction.inGuild === "function" ? interaction.inGuild() : false;
  if (!inGuild && options && typeof options === "object") {
    const { ephemeral: _ephemeral, ...deferOptions } = options;
    await interaction.deferReply(deferOptions);
    return;
  }

  await interaction.deferReply(options);
}

module.exports = {
  safeDefer,
  safeReply,
};
