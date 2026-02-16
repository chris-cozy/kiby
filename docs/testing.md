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

## CI

GitHub Actions workflow runs lint + tests on push and pull request.
