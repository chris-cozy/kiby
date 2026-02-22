const sleepCommand = require("../../src/commands/care/sleep");

function getSleepSetOptions() {
  const scheduleGroup = sleepCommand.options.find((option) => option.name === "schedule");
  const setSubcommand = scheduleGroup.options.find((option) => option.name === "set");
  return setSubcommand.options;
}

describe("/sleep command options", () => {
  it("uses 12-hour start choices mapped to 0-23 hour values", () => {
    const options = getSleepSetOptions();
    const startOption = options.find((option) => option.name === "start");

    expect(startOption.type).toBe(4);
    expect(startOption.autocomplete).toBeUndefined();
    expect(startOption.choices).toHaveLength(24);
    expect(startOption.choices[0]).toEqual({ name: "12 AM", value: 0 });
    expect(startOption.choices[1]).toEqual({ name: "1 AM", value: 1 });
    expect(startOption.choices[12]).toEqual({ name: "12 PM", value: 12 });
    expect(startOption.choices[23]).toEqual({ name: "11 PM", value: 23 });
  });

  it("uses explicit duration choices from 1 to 9 hours", () => {
    const options = getSleepSetOptions();
    const durationOption = options.find((option) => option.name === "duration_hours");

    expect(durationOption.type).toBe(4);
    expect(durationOption.choices.map((choice) => choice.value)).toEqual([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
    ]);
  });

  it("returns timezone autocomplete suggestions", async () => {
    const interaction = {
      options: {
        getFocused: () => ({
          name: "timezone",
          value: "",
        }),
      },
      respond: jest.fn().mockResolvedValue(undefined),
    };

    await sleepCommand.autocomplete({}, interaction);

    expect(interaction.respond).toHaveBeenCalledTimes(1);
    const payload = interaction.respond.mock.calls[0][0];
    expect(payload.length).toBeGreaterThan(0);
    expect(payload[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        value: expect.any(String),
      })
    );
  });
});
