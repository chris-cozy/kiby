const {
  getRemainingSleepMs,
  isInSleepWindow,
  isValidTimeZone,
  parseLocalTime,
} = require("../../src/domain/sleep/schedule");

describe("sleep schedule domain", () => {
  it("parses HH:mm to minute-of-day", () => {
    expect(parseLocalTime("00:00")).toBe(0);
    expect(parseLocalTime("23:59")).toBe(1439);
  });

  it("rejects invalid local times", () => {
    expect(() => parseLocalTime("24:00")).toThrow();
    expect(() => parseLocalTime("9:30")).toThrow();
  });

  it("evaluates sleep across wrapped midnight window", () => {
    const schedule = {
      enabled: true,
      timezone: "UTC",
      startMinuteLocal: 23 * 60,
      durationMinutes: 120,
    };

    expect(isInSleepWindow(new Date("2026-02-01T23:30:00.000Z"), schedule)).toBe(
      true
    );
    expect(isInSleepWindow(new Date("2026-02-02T00:30:00.000Z"), schedule)).toBe(
      true
    );
    expect(isInSleepWindow(new Date("2026-02-02T02:00:00.000Z"), schedule)).toBe(
      false
    );
  });

  it("handles different timezones for same instant", () => {
    const now = new Date("2026-01-15T07:00:00.000Z");
    const la = {
      enabled: true,
      timezone: "America/Los_Angeles",
      startMinuteLocal: 23 * 60,
      durationMinutes: 8 * 60,
    };
    const tokyo = {
      enabled: true,
      timezone: "Asia/Tokyo",
      startMinuteLocal: 23 * 60,
      durationMinutes: 8 * 60,
    };

    expect(isInSleepWindow(now, la)).toBe(true);
    expect(isInSleepWindow(now, tokyo)).toBe(false);
  });

  it("handles DST transition windows without throwing", () => {
    const schedule = {
      enabled: true,
      timezone: "America/Los_Angeles",
      startMinuteLocal: parseLocalTime("01:30"),
      durationMinutes: 120,
    };

    const beforeTransition = new Date("2026-03-08T09:15:00.000Z");
    const afterTransition = new Date("2026-03-08T10:30:00.000Z");

    expect(() => isInSleepWindow(beforeTransition, schedule)).not.toThrow();
    expect(() => isInSleepWindow(afterTransition, schedule)).not.toThrow();
  });

  it("computes remaining milliseconds when asleep", () => {
    const schedule = {
      enabled: true,
      timezone: "UTC",
      startMinuteLocal: 60,
      durationMinutes: 120,
    };

    const remaining = getRemainingSleepMs(new Date("2026-02-01T02:00:00.000Z"), schedule);
    expect(remaining).toBeGreaterThan(0);
  });

  it("validates timezone identifiers", () => {
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("Mars/Phobos")).toBe(false);
  });
});
