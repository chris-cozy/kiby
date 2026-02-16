<div id="header" align="center">
  <img src="src\media\gifs\kirby-cute.gif" width="500"/>
</div>
<!-- 
<img src="https://tenor.com/KPwY.gif" width="500"/>
-->

# Kiby v2.0.0

Kiby is a Discord virtual pet system where users adopt a Kirby, maintain its needs, and compete on a shared global leaderboard.

v2.0.0 focuses on production readiness, timezone-aware sleep scheduling, and a seeded social ecosystem via synthetic participants.

## Highlights
- Timezone-based sleep scheduling per player (`/sleep schedule set`)
- Automatic care decay and health simulation loops
- Mixed leaderboard with real players and baseline competitors
- Deterministic NPC simulation tiers (casual, active, competitive)
- Health endpoint, graceful shutdown, and container-first deployment
- Domain/service oriented architecture to support future Discord + web surfaces

## Commands
### Configuration
- `/adopt name:<name>`: Adopt a Kiby
- `/revive`: Revive your most recent fallen Kiby
- `/sleep schedule set timezone:<IANA> start:<HH:mm> duration_hours:<1-9>`
- `/sleep schedule view`
- `/sleep schedule clear`

### Care
- `/feed`: Increase hunger + XP
- `/pet`: Increase affection + XP (allowed while asleep)
- `/play`: Increase affection + XP

### Information
- `/info`: View your Kiby profile and rank
- `/cooldowns`: View action cooldowns + current sleep state
- `/leaderboard`: View mixed top leaderboard
- `/help`: Command reference
- `/ping`: Latency check

### Economy And Progression
- `/shop list|buy`: Purchase consumables
- `/inventory`: View item inventory and Star Coin balance
- `/use`: Consume an item to boost Kiby stats
- `/daily`: Claim daily login reward
- `/quests view|claim`: Track and claim daily care quests

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

## Architecture
See:
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
