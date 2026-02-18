<div id="header" align="center">
  <img src="src\media\gifs\kirby-cute.gif" width="500"/>
</div>

# Kiby v2.0.0

Kiby is a Discord virtual pet system where users adopt a Kiby, maintain core needs, and progress through competitive/social long-term loops.
v2.0.0 focuses on production readiness, timezone-aware sleep scheduling, and a seeded social ecosystem via synthetic participants.

## Highlights
- Timezone-based sleep scheduling with autocomplete timezone input
- Automatic care decay and health simulation loops
- Mixed leaderboard with real players and baseline competitors
- Deterministic NPC simulation tiers (casual, active, competitive)
- Health endpoint, graceful shutdown, and container-first deployment
- Domain/service oriented architecture to support future Discord + web surfaces
- Expanded care kit: `/feed`, `/pet`, `/play`, `/cuddle`, `/train`, `/bathe`
- New `social` stat + mood-driven conversation and ambient Kiby behaviors
- Player-local daily reset, streak shield, 3-slot quest board + bonus quest + reroll
- Expanded item economy with consumables, toys, and adventure support items
- Coin/item gifting with anti-abuse caps and fees
- Async adventures with baseline duration options, checkpoint damage, and wounded-return failure flow
- Adventure route expansion and risk loop updates:
  - no BP route start gates
  - Battle Power-dominant readiness
  - recommended route tiers: `0 / 90 / 180 / 300`
  - new route: **Obsidian Citadel**
  - ETA variance windows and completion notifications
  - location visibility command (`/adventure locations`)
- Dual event layer:
  - personal random world events
  - global campaign events with contribution rewards
- Global event enhancements:
  - active-player goal scaling (24h activity window)
  - developer manual event trigger (`/globalevent start`)
- Kiby language progression (v1):
  - tokenized Kiby flavor text
  - per-player translation unlock by exposure
  - `/language` command
- Direct in-product feedback command (`/feedback`)
- Leaderboard modes:
  - total
  - season (weekly/bi-weekly cadence)
  - players-only (developer-restricted)
- Title unlock/equip system shown in leaderboard entries

## Commands
### Configuration
- `/adopt name:<name>`: Adopt a Kiby
- `/revive`: Revive your most recent fallen Kiby
- `/sleep schedule set timezone:<IANA> start:<HH:mm> duration_hours:<1-9>`
- `/sleep schedule view`
- `/sleep schedule clear`
- `/ambient view|set`

### Care
- `/feed`: Increase hunger + XP
- `/pet`: Increase affection + XP (allowed while asleep)
- `/play`: Increase affection + XP
- `/cuddle`: Increase affection + XP (allowed while asleep)
- `/train`: Primary Battle Power growth action
- `/bathe`

### Economy And Progression
- `/shop list|buy`: Purchase consumables
- `/inventory`: View item inventory and Star Coin balance
- `/use`: Consume an item to boost Kiby stats
- `/gift coins|item` (recipient DM notification on successful transfer)

### Social + Progression
- `/social play-with|interact|settings`
- `/daily`
- `/quests view|claim|reroll`
- `/titles view|equip`
- `/events view|claim`
- `/adventure start|status|claim|locations`
- `/language`
- `/feedback category:<bug|balance|feature|ux|other> message:<text>`

### Information
- `/info`: View your Kiby profile and rank
- `/cooldowns`: View action cooldowns + current sleep state
- `/leaderboard`: View mixed top leaderboard
- `/help`: Command reference
- `/ping`: Latency check

### Developer
- `/system subject:<text> body:<text>`
- `/globalevent start event:<event_key>`

## Setup
### Requirements
- Node.js 20+
- MongoDB 7+
- Discord bot token and application

### Install
```bash
npm install
cp .env.production.example .env
```

Set required values in `.env`:
- `TOKEN`
- `MONGO_CONNECTION`

### Run
```bash
npm start
```

### Dev
```bash
npm run dev
npm run lint
npm run test
npm run seed:npcs:reset
```

## Deployment
### Docker
```bash
docker build -t kiby:2.0.0 .
docker run --env-file .env -p 8080:8080 kiby:2.0.0
```

### Docker Compose
```bash
docker compose up --build
```

Health check endpoint:
- `GET /health` on `HEALTH_PORT`

## Configuration
Use `.env.production.example` for all supported variables, including:
- Runtime/logging
- Care simulation intervals
- Default sleep schedule
- NPC population and tick cadence
- Battle Power and adventure tuning
- Global event scaling constants
- Kiby language progression tuning

## Architecture + Docs
- `docs/architecture.md`
- `docs/gameplay.md`
- `docs/deployment.md`
- `docs/policy.md`
- `docs/commands.md`
- `docs/testing.md`
- `docs/roadmap-completion.md`

## Notes
- `src/media` is intentionally gitignored and required at runtime for embed assets.
- This release is treated as a fresh production launch; no live migration path is assumed.
