# Architecture

## Runtime Shape
- `src/app.js`: startup orchestration, env validation, DB connection, Discord login, health server, graceful shutdown.
- `src/handlers/eventHandler.js`: event registration from `src/events/*`.
- `src/events/ready/03careChecking.js`: scheduler bootstrap.

## Layers
### Domain (`src/domain`)
Pure rules and deterministic logic:
- `care/rules.js`
- `sleep/schedule.js`
- `progression/calculateXpForLevel.js`
- `npc/simulator.js`
- `battle/contracts.js` (future battle-ready profile projection scaffolding)

### Repositories (`src/repositories`)
Persistence abstraction over mongoose models:
- `playerRepository`
- `sleepScheduleRepository`
- `npcRepository`
- `deathHistoryRepository`
- `playerEconomyRepository`
- `playerProgressRepository`

### Services (`src/services`)
Business orchestration:
- `playerService`: adoption/profile fetch
- `sleepService`: schedule validation and resolution
- `careService`: action handling + decay tick
- `npcService`: seed + simulation ticks
- `eventService`: periodic world event execution
- `leaderboardService`: mixed board assembly
- `schedulerService`: periodic loop management
- `notificationService`: outbound DM notifications
- `economyService`: shop/inventory/use item flows
- `progressionService`: daily rewards, streaks, and quest progression
- `web/profileProjectionService`: shared DTO shaping for future web client surfaces

### Commands (`src/commands`)
Thin Discord adapters that:
1. Parse interaction input
2. Call services
3. Render embeds/responses

## Data Flow
1. User invokes slash command.
2. `interactionCreate` routes to a command module.
3. Command delegates to service methods.
4. Service applies domain logic and persists via repository.
5. Command renders resulting state to Discord.

## Scheduler Flow
1. On ready, scheduler starts care + NPC intervals.
2. Care interval:
- loads players
- skips sleeping users
- applies decay
- emits hunger/affection/death notifications
3. NPC interval:
- simulates each NPC by tier behavior
- applies deterministic progression/decay
- records NPC deaths

## Extension Guidelines
- Keep game rules in `src/domain` to remain reusable for Discord and future web surfaces.
- New delivery channels should call service methods, not domain or repositories directly.
- Add new persistence models via repositories to keep service boundaries stable.
