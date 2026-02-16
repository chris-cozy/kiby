const sanitizeKirbyName = require("../../src/utils/sanitizeKirbyName");

describe("sanitizeKirbyName", () => {
  it("removes disallowed characters and mention symbols", () => {
    const value = sanitizeKirbyName("@@@Kirby!!", 24);
    expect(value).toBe("Kirby");
  });

  it("rejects empty names", () => {
    expect(() => sanitizeKirbyName("   ", 24)).toThrow();
  });
});
