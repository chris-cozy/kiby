# Testing Guide

## Automated Checks

- `npm run lint`
- `npm run test`

Current test suites cover:
- Sleep scheduling and timezone logic
- Care rule cooldown and decay behavior
- NPC deterministic simulation
- Battle contract projection scaffold
- Kirby name sanitization

## Validation Targets

- Command lifecycle safety (`defer/reply/edit` behavior)
- Sleep schedule max duration and format enforcement
- Mixed leaderboard sorting behavior
- NPC seed and tick execution stability
- World event execution guardrails
- Adventure lifecycle checks (start/status/claim + failure handling)
- Global campaign event contribution and claim logic
- Quest board progression, reroll, and streak-shield behavior
- Economy transfer guardrails for gifting and non-tradable items

## CI

GitHub Actions workflow runs lint + tests on push and pull request.
