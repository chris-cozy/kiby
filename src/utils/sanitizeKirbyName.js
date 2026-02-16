function sanitizeKirbyName(rawName, maxLength = 24) {
  const trimmed = String(rawName || "").trim();
  if (!trimmed) {
    throw new Error("Kirby name is required.");
  }

  const normalizedWhitespace = trimmed.replace(/\s+/g, " ");
  const stripped = normalizedWhitespace.replace(/[^a-zA-Z0-9 _.-]/g, "");
  const withoutMentions = stripped.replace(/@/g, "");
  const finalName = withoutMentions.slice(0, maxLength).trim();

  if (!finalName) {
    throw new Error("Kirby name must include letters or numbers.");
  }

  return finalName;
}

module.exports = sanitizeKirbyName;
