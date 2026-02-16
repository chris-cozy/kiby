# PR: Kiby v2.0.0 Fresh Launch Rebuild

## Title
`feat: launch Kiby v2.0.0 with timezone sleep scheduling, NPC ecosystem, and production-ready architecture`

## Summary
This PR delivers the v2.0.0 rebuild as a fresh production launch. It replaces legacy architecture with a domain/service/repository model, adds player-configurable sleep scheduling by timezone, seeds and simulates NPC participants for social baseline activity, introduces progression/economy loops, and hardens the runtime for containerized deployment.

## Scope

### Core Architecture
- Refactored gameplay logic into domain modules (`care`, `sleep`, `npc`, `progression`, `events`, `battle scaffolding`).
- Added service orchestration for care ticks, NPC ticks, world events, economy, progression, notifications, and scheduling.
- Added repository layer for persistence access patterns.

### Data Model
- Added new models:
  - `PlayerProfile`
  - `SleepSchedule`
  - `NpcProfile`
  - `DeathHistory`
  - `PlayerEconomy`
  - `PlayerProgress`
- Removed legacy schemas (`stats`, `dates`, `deaths`) used by pre-v2 runtime.

### Gameplay and Commands
- Sleep redesign to schedule-first model:
  - `/sleep schedule set|view|clear`
- Core care commands retained and reworked:
  - `/adopt`, `/revive`, `/feed`, `/pet`, `/play`, `/cooldowns`, `/info`, `/leaderboard`, `/help`, `/ping`
- Added progression/economy features:
  - `/shop`, `/inventory`, `/use`, `/daily`, `/quests`
- Added periodic world event engine.

### NPC Ecosystem
- Seeded baseline participants (36 total: casual/active/competitive split via config).
- Deterministic tiered simulation loop for stable progression behavior.
- Mixed player + NPC leaderboard composition.

### Runtime / Deployment
- Centralized env validation with fail-fast startup.
- Structured JSON logging.
- Health endpoint (`/health`) with readiness/degraded status.
- Graceful shutdown (`SIGINT`/`SIGTERM`).
- Dockerfile modernized for Node 20 + non-root runtime.
- Docker Compose added for local containerized testing.

### Quality / Tooling
- Added ESLint, Prettier, Jest, CI workflow.
- Added domain tests for sleep, care, NPC simulation, world events, battle contract scaffold, and sanitization.

### Documentation
- README rewritten for v2.0.0.
- `CHANGELOG.md` created and legacy history consolidated under `1.0.0` baseline.
- `releaseNotes.md` updated to v2-focused notes with legacy pointer.
- Top.gg listing content rewritten to match current product and install modes.
- Added docs set: architecture, gameplay, deployment, commands, testing, policy, roadmap completion.

## Breaking Changes
- Legacy manual sleep semantics replaced by schedule-based automatic sleep.
- Legacy schemas removed; v2 uses fresh-launch models.
- Command sync now always includes global command registration for user-install compatibility.

## Security and Safety
- Kirby name sanitization to reduce mention/format abuse.
- Safer interaction reply/defer handling across guild and user-install contexts.
- Notification send failures are isolated and logged.

## Verification
- `npm run lint` ✅
- `npm run test` ✅ (`6` suites, `14` tests)

## Deployment Notes
- Required env vars:
  - `TOKEN`
  - `MONGO_CONNECTION`
- Optional but recommended:
  - `DEV_USER_IDS`, `TEST_GUILD_ID`, schedule and NPC tuning vars.
- For local Docker testing, run with `docker compose up --build`.

## Follow-up
- Add battle runtime implementation on top of battle contract scaffolding.
- Add first API surface for future web client operations.
