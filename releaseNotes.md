# Release Notes

## Version 2.0.0 - February 16, 2026

- Rebuilt Kiby as a fresh production launch with domain/service/repository architecture.
- Added timezone-aware sleep schedule management using `/sleep schedule set|view|clear`.
- Added seeded NPC ecosystem (36 baseline participants) and mixed leaderboard.
- Added economy/progression systems (`/shop`, `/inventory`, `/use`, `/daily`, `/quests`).
- Added expanded care actions: `/cuddle`, `/train`, `/bathe`.
- Added `social` stat, mood system, and mood-aware Kiby conversation behavior.
- Added autonomous ambient Kiby moments with opt-in controls (`/ambient`).
- Reworked progression loop:
  - player-local daily reset (timezone-based)
  - streak shield mechanic
  - 3-slot daily quest board + bonus quest
  - daily quest reroll support.
- Added titles system (`/titles view|equip`) and leaderboard title display.
- Added seasonal leaderboard mode and season rollover snapshot support.
- Added dev-restricted players-only leaderboard mode and leaderboard count options.
- Added expanded economy:
  - larger shop catalog
  - toy-specific play boosts with fatigue balancing
  - adventure support items
  - persistent inventory/coins after Kiby death.
- Added gifting commands:
  - `/gift coins`
  - `/gift item`
- Added social interaction suite:
  - `/social play-with` (one-way, no target notification)
  - `/social interact` (target opt-in)
  - `/social settings`.
- Added asynchronous adventure system (`/adventure start|status|claim`) with:
  - fixed baseline duration options
  - checkpoint damage simulation
  - fail-threshold early return
  - wounded recovery loop on failed runs.
- Added dual-layer world event model:
  - existing random personal events retained
  - new global campaign events with contribution rewards (`/events view|claim`).
- Added revive economy updates:
  - significant revive coin cost
  - revive token safety valve.
- Updated sleep command UX with timezone autocomplete guidance.
- Added production runtime hardening: env validation, structured logs, graceful shutdown, health checks.
- Added Docker + Docker Compose deployment support.
- Added lint/test/CI scaffolding and expanded documentation.

## Version 2.0.0 - Finalization Updates (February 17, 2026)

- Added Battle Power progression:
  - persistent `battlePower` stat
  - train-based growth
  - passive lazy decay.
- Expanded adventures:
  - route recommendations shifted to `0 / 90 / 180 / 300`
  - added fourth route: **Obsidian Citadel**
  - removed BP hard start gates
  - BP-dominant readiness and risk model
  - ETA windows (`baseline * 0.75` to `baseline * 1.25`)
  - route images on start/status/claim embeds
  - completion DM notifications
  - new `/adventure locations` command.
- Updated care rules:
  - care actions locked while active adventure is in progress
  - asleep allowances updated (`pet` and `cuddle` allowed).
- Tightened social policy:
  - positive social points only from `/social play-with` and `/social interact`
  - removed positive social gains from solo care, toy use, and passive effects.
- Expanded global event controls:
  - developer-only `/globalevent start`
  - active-player goal scaling using 24h activity.
- Added Kiby language progression v1:
  - tokenized Kiby dialogue/flavor
  - per-player translation unlocks by exposure
  - `/language` command.
- Added `/feedback` command for direct player feedback to developers.
- Added recipient DM notifications for gifted coins/items.
- Updated configuration/documentation for all above changes under the v2.0.0 release line.

## Legacy Note

All pre-2.0 historical release notes remain in `/CHANGELOG.md` under the `1.0.0` legacy baseline section.
