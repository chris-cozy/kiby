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
- global event tuning (`GLOBAL_EVENT_DURATION_MIN_HOURS`, `GLOBAL_EVENT_DURATION_MAX_HOURS`, `GLOBAL_EVENT_IDLE_GAP_MIN_HOURS`, `GLOBAL_EVENT_IDLE_GAP_MAX_HOURS`, `GLOBAL_EVENT_START_CHANCE_PER_TICK_PERCENT`, `GLOBAL_EVENT_GOAL_MIN`, `GLOBAL_EVENT_GOAL_MAX`)
- season cadence (`SEASON_LENGTH_DAYS`: `7` or `14`)
- revive/economy/social guardrails (`REVIVE_*`, `GIFT_*`, `SOCIAL_RECEIVE_COOLDOWN_MINUTES`)
- ambient + adventure controls (`AMBIENT_*`, `ADVENTURE_*`)

## Local Docker
```bash
docker build -t kiby:2.1.0 .
docker run --env-file .env -p 8080:8080 kiby:2.1.0
```

## Docker Compose
```bash
docker compose up --build
```

Services:
- `kiby`: Discord bot runtime
- `mongo`: local MongoDB

### NAS Bind-Mount Permissions
If the container crashes with `EACCES: permission denied, open '/app/package.json'`, the app user cannot read files in `/app`.

Preferred production setup:
- do not bind-mount the project source into `/app`
- let the image copy files at build time

If you intentionally bind-mount source on a NAS, either:
- make the project directory readable by the container user (for example `chmod -R a+rX <project-dir>`)
- or run the service with a matching host UID/GID:

```yaml
services:
  kiby:
    user: "${PUID:-1000}:${PGID:-1000}"
```

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
