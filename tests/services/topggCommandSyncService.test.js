const topggCommandSyncService = require("../../src/services/topggCommandSyncService");

describe("topggCommandSyncService", () => {
  it("builds a top.gg command payload from local command definitions", () => {
    const payload = topggCommandSyncService.buildTopggCommandPayload([
      {
        name: "tutorial",
        description: "Manage onboarding tutorial runs.",
        options: [
          {
            type: 1,
            name: "start",
            description: "Start tutorial.",
          },
        ],
      },
      {
        name: "legacy",
        description: "Legacy command",
        deleted: true,
      },
      {
        name: "sleep",
        description: "Manage sleep schedule.",
        dmPermission: false,
        defaultMemberPermissions: "8",
        options: [
          {
            type: 4,
            name: "duration_hours",
            description: "Duration",
            minValue: 1,
            max_value: 9,
            choices: [
              { name: "1", value: 1 },
              { name: "2", value: 2 },
            ],
          },
        ],
      },
    ]);

    expect(payload).toEqual([
      {
        name: "tutorial",
        description: "Manage onboarding tutorial runs.",
        type: 1,
        options: [
          {
            type: 1,
            name: "start",
            description: "Start tutorial.",
          },
        ],
      },
      {
        name: "sleep",
        description: "Manage sleep schedule.",
        type: 1,
        dm_permission: false,
        default_member_permissions: "8",
        options: [
          {
            type: 4,
            name: "duration_hours",
            description: "Duration",
            min_value: 1,
            max_value: 9,
            choices: [
              { name: "1", value: 1 },
              { name: "2", value: 2 },
            ],
          },
        ],
      },
    ]);
  });

  it("formats authorization as bearer token", () => {
    expect(topggCommandSyncService.formatTopggAuthorization("abc123")).toBe(
      "Bearer abc123"
    );
    expect(topggCommandSyncService.formatTopggAuthorization("Bearer xyz")).toBe(
      "Bearer xyz"
    );
  });

  it("skips publish when token is missing", async () => {
    const fetchImpl = jest.fn();
    const result = await topggCommandSyncService.publishLocalCommands(
      [{ name: "ping", description: "Ping." }],
      { token: "", fetchImpl }
    );

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "missing-token",
      commandCount: 1,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts slash commands to top.gg endpoint", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: jest.fn().mockResolvedValue(""),
    });

    const result = await topggCommandSyncService.publishLocalCommands(
      [{ name: "ping", description: "Ping." }],
      {
        token: "token-1",
        fetchImpl,
        endpoint: "https://example.com/commands",
      }
    );

    expect(result).toEqual({
      ok: true,
      skipped: false,
      commandCount: 1,
    });
    expect(fetchImpl).toHaveBeenCalledWith("https://example.com/commands", {
      method: "POST",
      headers: {
        Authorization: "Bearer token-1",
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          name: "ping",
          description: "Ping.",
          type: 1,
        },
      ]),
    });
  });

  it("returns an error payload when top.gg rejects the request", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: jest.fn().mockResolvedValue("invalid token"),
    });

    const result = await topggCommandSyncService.publishLocalCommands(
      [{ name: "ping", description: "Ping." }],
      {
        token: "bad-token",
        fetchImpl,
        endpoint: "https://example.com/commands",
      }
    );

    expect(result).toEqual({
      ok: false,
      skipped: false,
      reason: "http-error",
      statusCode: 401,
      error: "invalid token",
      commandCount: 1,
    });
  });
});
