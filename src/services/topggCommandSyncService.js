const CHAT_INPUT_COMMAND_TYPE = 1;
const TOPGG_COMMANDS_ENDPOINT = "https://top.gg/api/v1/projects/@me/commands";

function normalizeOption(option = {}) {
  const normalized = {
    type: option.type,
    name: option.name,
    description: option.description || "",
  };

  if (option.required !== undefined) {
    normalized.required = Boolean(option.required);
  }

  if (option.autocomplete !== undefined) {
    normalized.autocomplete = Boolean(option.autocomplete);
  }

  const minValue = option.min_value ?? option.minValue;
  if (minValue !== undefined && minValue !== null) {
    normalized.min_value = minValue;
  }

  const maxValue = option.max_value ?? option.maxValue;
  if (maxValue !== undefined && maxValue !== null) {
    normalized.max_value = maxValue;
  }

  const minLength = option.min_length ?? option.minLength;
  if (minLength !== undefined && minLength !== null) {
    normalized.min_length = minLength;
  }

  const maxLength = option.max_length ?? option.maxLength;
  if (maxLength !== undefined && maxLength !== null) {
    normalized.max_length = maxLength;
  }

  const channelTypes = option.channel_types ?? option.channelTypes;
  if (Array.isArray(channelTypes) && channelTypes.length) {
    normalized.channel_types = channelTypes;
  }

  if (Array.isArray(option.choices) && option.choices.length) {
    normalized.choices = option.choices.map((choice) => ({
      name: choice.name,
      value: choice.value,
    }));
  }

  if (Array.isArray(option.options) && option.options.length) {
    normalized.options = option.options.map((nested) => normalizeOption(nested));
  }

  return normalized;
}

function normalizeCommand(command = {}) {
  const normalized = {
    name: command.name,
    description: command.description || "",
    type: command.type || CHAT_INPUT_COMMAND_TYPE,
  };

  if (Array.isArray(command.options) && command.options.length) {
    normalized.options = command.options.map((option) => normalizeOption(option));
  }

  const dmPermission = command.dm_permission ?? command.dmPermission;
  if (dmPermission !== undefined) {
    normalized.dm_permission = Boolean(dmPermission);
  }

  const defaultMemberPermissions =
    command.default_member_permissions ?? command.defaultMemberPermissions;
  if (
    defaultMemberPermissions !== undefined &&
    defaultMemberPermissions !== null &&
    defaultMemberPermissions !== ""
  ) {
    normalized.default_member_permissions = String(defaultMemberPermissions);
  }

  if (command.nsfw !== undefined) {
    normalized.nsfw = Boolean(command.nsfw);
  }

  return normalized;
}

function buildTopggCommandPayload(localCommands = []) {
  return (localCommands || [])
    .filter(
      (command) =>
        command &&
        !command.deleted &&
        typeof command.name === "string" &&
        command.name.length &&
        typeof command.description === "string" &&
        command.description.length
    )
    .map((command) => normalizeCommand(command));
}

function formatTopggAuthorization(token) {
  const safeToken = String(token || "").trim();
  if (!safeToken) {
    return "";
  }

  if (/^Bearer\s+/i.test(safeToken)) {
    return safeToken;
  }

  return `Bearer ${safeToken}`;
}

async function readResponseBodySafe(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

async function pushSlashCommandsToTopgg(commands, options = {}) {
  const token = options.token || "";
  const endpoint = options.endpoint || TOPGG_COMMANDS_ENDPOINT;
  const fetchImpl = options.fetchImpl || global.fetch;

  if (!token) {
    return {
      ok: false,
      skipped: true,
      reason: "missing-token",
      commandCount: commands.length,
    };
  }

  if (typeof fetchImpl !== "function") {
    return {
      ok: false,
      skipped: true,
      reason: "missing-fetch",
      commandCount: commands.length,
    };
  }

  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: formatTopggAuthorization(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      const errorBody = await readResponseBodySafe(response);
      return {
        ok: false,
        skipped: false,
        reason: "http-error",
        statusCode: response.status,
        error: errorBody || response.statusText || "Top.gg command sync failed.",
        commandCount: commands.length,
      };
    }

    return {
      ok: true,
      skipped: false,
      commandCount: commands.length,
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      reason: "network-error",
      error: error.message,
      commandCount: commands.length,
    };
  }
}

async function publishLocalCommands(localCommands, options = {}) {
  const commands = buildTopggCommandPayload(localCommands);
  return pushSlashCommandsToTopgg(commands, options);
}

module.exports = {
  TOPGG_COMMANDS_ENDPOINT,
  buildTopggCommandPayload,
  formatTopggAuthorization,
  pushSlashCommandsToTopgg,
  publishLocalCommands,
};
