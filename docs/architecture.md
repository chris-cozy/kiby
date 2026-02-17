# Architecture

## Runtime Shape
- `src/app.js`: startup orchestration, env validation, DB connection, Discord login, health server, graceful shutdown.
- `src/handlers/eventHandler.js`: event registration from `src/events/*`.
- `src/events/ready/03careChecking.js`: scheduler bootstrap.

## Layers
### Domain (`src/domain`)
Pure game logic:
- `care/rules.js`
- `sleep/schedule.js`
- `mood/evaluateMood.js`
- `progression/calculateXpForLevel.js`
- `season/season.js`
- `npc/simulator.js`
- `events/worldEvents.js`
- `events/globalEvents.js`
- `battle/contracts.js`

### Repositories (`src/repositories`)
Persistence abstraction over Mongoose:
- player/sleep/npc/death repositories
- progression/economy repositories
- season repositories (`seasonEntry`, `seasonState`, `seasonSnapshot`)
- event repository (`globalEvent`)
- adventure repository (`playerAdventure`)

### Services (`src/services`)
Business orchestration:
- `playerService`: adoption/profile lifecycle
- `sleepService`: schedule validation and sleep-state resolution
- `careService`: care actions + decay tick
- `npcService`: seed + deterministic NPC simulation
- `eventService`: personal random world event tick
- `globalEventService`: global campaign event lifecycle and rewards
- `progressionService`: local daily reset, streak shields, quest board, lifetime counters
- `economyService`: shop/inventory/use/gift/item-context effects
- `socialService`: one-way and opt-in social interactions
- `adventureService`: async PvE route runs, checkpoint damage, claim processing
- `seasonService`: weekly/bi-weekly season context, seasonal XP entries, rollover snapshots
- `titleService`: unlock/equip title management
- `leaderboardService`: total/season/players leaderboard assembly
- `ambientService`: autonomous mood-based ambient moments
- `notificationService`: outbound DM notifications
- `dialogueService`: mood/context-aware dialogue generation
- `web/profileProjectionService`: shared DTO shaping for future web surfaces
- `schedulerService`: periodic loop management

### Commands (`src/commands`)
Discord adapters that:
1. Parse interaction options.
2. Delegate to services.
3. Render embeds and responses.

## Scheduler Flow
On ready:
1. Ensure NPC seed and season state.
2. Start repeating loops:
- care decay tick
- NPC simulation tick
- personal random world event tick
- ambient behavior tick
- global event completion monitor

## Data Flow
1. User invokes command.
2. `interactionCreate` resolves command or autocomplete path.
3. Command calls service orchestration.
4. Services apply domain rules + persist via repositories.
5. Command renders updated state.

## Key Design Decisions
- Player-local daily resets are timezone-based, not UTC-only.
- Economy and progression outlive active Kiby death.
- Seasonal leaderboard uses separate season entry records (archivable by season key).
- Social play includes one-way no-notify interactions to avoid spam pressure.
- Async adventures resolve with bounded risk and non-lethal HP floor.

## Extension Guidelines
- Keep game rules in `src/domain` to remain reusable for Discord and future web surfaces.
- New delivery channels should call service methods, not domain or repositories directly.
- Add new persistence models via repositories to keep service boundaries stable.