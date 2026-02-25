# Testing Guide (v2.2.0)

## Automated Checks
- `npm run lint`
- `npm run test`

## Current Automated Coverage
- Sleep schedule timezone behavior
- Cooldowns embed active-timer filtering
- Care cooldown/decay rules
- Top.gg slash-command sync payload and publish handling
- Solo social-gain guardrails in care rules
- Battle profile projection
- Battle power decay/training helpers
- Adventure route tier constants
- NPC simulation stability
- World event delta sanity
- Kiby name sanitization

## Manual Validation Matrix
### World events / global events
- non-dev blocked from `/globalevent start`
- dev can start selected global event when none is active
- manual start blocked when active global event exists
- global event goal scales correctly with active-player counts
- global event does not auto-start from `/events view`, `/events claim`, or contribution code paths
- scheduler start requires eligibility window + chance pass
- duration always resolves within configured random range (`24-72h`)
- idle gap always resolves within configured random range (`24-48h`)
- active users (last 24h action) receive start notification fanout on event start
- `/events view` shows no-active-event idle state when idle
- `/events claim` returns no-active-event when no global event is running

### Social policy
- solo care actions do not increase social
- toy/direct item use does not grant positive social
- `/playdate send` enforces receiver inbound cooldown (default 45m) for player targets
- `/playdate send` applies sender + receiver stat gains on success
- `/playdate send` sends receiver DM notification best-effort (no rollback on DM failure) for player targets
- `/playdate send` can target NPCs without receiver DM dependency
- `/park leave` resolves social gain + hunger drain proportionally for early exits
- `/park status` returns occupancy count and remaining time when active
- `/park send` and `/park status` do not reveal projected social/hunger effects

### Battle power / adventures
- `/train` increases battle power
- BP decay is lazily applied after elapsed time
- all routes start without BP hard-gates
- low BP materially increases failure risk and reduces rewards
- longer durations materially increase danger/failure risk
- Obsidian Citadel route appears and runs
- ETA windows display and resolve within variance bounds
- adventure start/status embeds show `Danger Level` and omit projected rewards in status
- once adventure is complete, `/adventure claim` is required before additional game actions

### Adventure lock / sleep
- care commands block while active adventure is in progress
- care commands block while Kiby is actively at the park
- non-care commands remain available during adventure
- asleep state allows only `pet` and `cuddle`
- `cuddle` works while asleep

### Language
- ambient/adventure/event surfaces emit Kiby tokens
- repeated exposure unlocks translations
- `/language` reflects discovered/unknown counts and sample glossary

### Feedback / gifting
- `/feedback` fans out to all configured developer IDs
- gift receiver gets DM on successful coins/item transfer
- sender success is preserved when receiver DM fails

## CI
GitHub Actions runs lint + tests on push and pull requests.
