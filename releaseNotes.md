# Release Notes

## Version 2.2.0 - Unreleased

- Replaced legacy social command surface:
  - `/social interact` -> `/playdate send`
  - `/social play-with` -> `/park send|status|leave`
  - `/playdate settings` added for inbound player-playdate opt-in control.
- Expanded playdate targeting:
  - supports global player + NPC Kiby targeting
  - no local server/channel restriction for target selection
  - player targets retain owner notification behavior.
- Added asynchronous park social-care loop:
  - duration-based social gain and hunger drain
  - early-leave proportional resolution
  - automatic return/resolution when duration ends without `/park leave`
  - occupancy + remaining-time visibility via `/park status`.
- Park and playdate balancing/UX updates:
  - park social gain increased significantly; hunger drain increased moderately
  - park projected effects removed from send/status embeds (outcome shown on resolution only)
  - NPC labeling standardized to `✧`
  - player type labels removed from playdate surfaces.
- Adventure UX and control-flow refresh:
  - replaced split risk/preparedness display with single `Danger Level`
  - removed projected rewards from adventure embeds
  - reward balancing adjusted by route + duration
  - completed adventures now require `/adventure claim` before other commands proceed.
- Tutorial updates:
  - added required social-care sequence before adventure (`/park send` -> `/park leave` -> `/playdate settings` -> `/playdate send`)
  - fixed park-step backtracking loop
  - playdate tutorial action now uses actual Kiby name instead of placeholder.

## Version 2.1.1 - 2026-02-24

- Removed privileged-intent requirements from the runtime intent set:
  - removed `GuildMembers`, `GuildMessages`, and `MessageContent`
  - retained `Guilds` and `DirectMessages`.
- Removed mention-triggered `messageCreate` conversation replies; user interaction is now slash-command + DM oriented.
- Updated command permission checks to rely on interaction-provided app permissions where available.
- Improved `/system mode:all_installed` delivery reliability:
  - tries preferred channels first (`systemChannel`, `publicUpdatesChannel`)
  - falls back across additional guild text/announcement channels
  - stops after first successful send per guild
  - updates delivery reporting to server-level candidate targeting.

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

## Version 2.0.0 - Event Cadence + Social Anti-Spam Update (February 18, 2026)

- Refactored global campaign lifecycle to scheduler-driven sporadic starts:
  - removed lazy auto-start side effects from status/contribution/claim paths
  - random duration range: `24-72h`
  - random post-event idle gap range: `24-48h`
  - eligibility + chance start model (`35%` per tick once eligible).
- Added active-user global event start notifications:
  - audience: users active in last 24h (`lastActionAt`)
  - best-effort DM fanout with delivery/failure logging.
- Added new global event scheduler cycle state persistence (`GlobalEventCycleState`) for deterministic lifecycle tracking.
- Updated event command behavior:
  - `/events view` supports explicit idle state with next-eligible timing/cadence details
  - `/events claim` now returns no-active-event when no campaign event is running.
- Updated direct social interactions (`/social interact`):
  - receiver-side anti-spam cooldown (default 45 minutes)
  - successful interaction applies receiver stat gains
  - successful interaction sends receiver notification DM (best effort, no rollback on DM failure).
- Confirmed `/social play-with` remains one-way/no-notify with no receiver stat impact.
- Added new environment knobs:
  - `GLOBAL_EVENT_DURATION_MIN_HOURS`
  - `GLOBAL_EVENT_DURATION_MAX_HOURS`
  - `GLOBAL_EVENT_IDLE_GAP_MIN_HOURS`
  - `GLOBAL_EVENT_IDLE_GAP_MAX_HOURS`
  - `GLOBAL_EVENT_START_CHANCE_PER_TICK_PERCENT`
  - `SOCIAL_RECEIVE_COOLDOWN_MINUTES`.

## Legacy Note

All pre-2.0 historical release notes remain in `/CHANGELOG.md` under the `1.0.0` legacy baseline section.
