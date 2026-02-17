const COMMON_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Jerusalem",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Taipei",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function searchTimezones(input = "") {
  const query = String(input || "").trim().toLowerCase();
  if (!query) {
    return COMMON_TIMEZONES.slice(0, 25);
  }

  const startsWith = [];
  const includes = [];
  for (const timezone of COMMON_TIMEZONES) {
    const lower = timezone.toLowerCase();
    if (lower.startsWith(query)) {
      startsWith.push(timezone);
    } else if (lower.includes(query)) {
      includes.push(timezone);
    }
  }

  return [...startsWith, ...includes].slice(0, 25);
}

module.exports = {
  COMMON_TIMEZONES,
  searchTimezones,
};
