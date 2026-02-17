# Deployment

## Environment
Copy `.env.production.example` to `.env` and configure required secrets:
- `TOKEN`
- `MONGO_CONNECTION`

Optional:
- `TOPGG_KEY`
- custom scheduler intervals
- NPC configuration values
- world event chance tuning (`WORLD_EVENT_CHANCE_PERCENT`)
- global event tuning (`GLOBAL_EVENT_DURATION_HOURS`, `GLOBAL_EVENT_GOAL`)
- season cadence (`SEASON_LENGTH_DAYS`: `7` or `14`)
- revive/economy/social guardrails (`REVIVE_*`, `GIFT_*`)
- ambient + adventure controls (`AMBIENT_*`, `ADVENTURE_*`)

## Local Docker
```bash
docker build -t kiby:2.0.0 .
docker run --env-file .env -p 8080:8080 kiby:2.0.0
```

## Docker Compose
```bash
docker compose up --build
```

Services:
- `kiby`: Discord bot runtime
- `mongo`: local MongoDB

## Health
`GET /health`
- `200` when Discord + DB are ready
- `503` when degraded

## Operational Notes
- App handles `SIGINT` and `SIGTERM` for graceful shutdown.
- Scheduler intervals are configured via environment variables.
- Use structured logs for incident triage and simulation observability.
- You can manually seed NPC data using `npm run seed:npcs` when needed.
- To wipe and regenerate NPCs, run `npm run seed:npcs:reset`.
