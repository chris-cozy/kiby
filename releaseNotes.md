# Release Notes

## Version 2.0.0 - February 15, 2026

- Rebuilt Kiby as a fresh production launch with domain/service/repository architecture.
- Added timezone-aware sleep schedule management using `/sleep schedule set|view|clear`.
- Added seeded NPC ecosystem (36 baseline participants) and mixed leaderboard.
- Added economy/progression systems (`/shop`, `/inventory`, `/use`, `/daily`, `/quests`).
- Added world event engine for periodic Dream Land events.
- Added production runtime hardening: env validation, structured logs, graceful shutdown, health checks.
- Added Docker + Docker Compose deployment support.
- Added lint/test/CI scaffolding and expanded documentation.

## Legacy Note

All pre-2.0 historical release notes are preserved in `/CHANGELOG.md` under the `1.0.0` legacy baseline section.
