# v2.0.0 Roadmap Completion

This document maps implemented work to the approved roadmap.

## P0
- P0-1 Core correctness fixes: complete.
  - Command lifecycle safety, permission checks, schedule consistency, schema integrity.
- P0-2 Sleep scheduling system: complete.
  - Timezone/start/duration with auto enforcement and max 9 hours.
- P0-3 Data model redesign: complete.
  - Player, sleep schedule, NPC, death history, economy, and progression models.
- P0-4 NPC launch ecosystem: complete.
  - Tiered seed + periodic simulation.
- P0-5 Runtime/deploy baseline: complete.
  - Env validation, logging, health checks, graceful shutdown, Docker/Compose.
- P0-6 Test/quality baseline: complete.
  - Jest suites, linting, prettier config, CI workflow.
- P0-7 Documentation overhaul: complete.
  - README, CHANGELOG, docs set, production env template.

## P1
- P1-1 Domain/service refactor: complete.
- P1-2 Performance tuning baseline: complete.
  - Cached command/media loading, reduced repeated schedule lookups.
- P1-3 Abuse/security controls: complete.
  - Name sanitization and safer interaction handling.
- P1-4 Observability baseline: complete.
  - Structured logs and scheduler run summaries.
- P1-5 Dependency/tooling modernization: complete.
  - Node 20 target, lint/test scripts, CI gates, container refresh.

## P2
- P2-1 Item/inventory/shop: complete.
  - `/shop`, `/inventory`, `/use`.
- P2-2 Event engine: complete.
  - Random world event tick with persisted stat effects.
- P2-3 Battle-ready scaffolding: complete.
  - Battle contract projection module for future systems.
- P2-4 Web-client readiness layer: complete.
  - Shared web profile projection service.
- P2-5 Achievement/streak/quest loop: complete.
  - `/daily` streak rewards and `/quests` progress + claim flow.
