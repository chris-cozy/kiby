# Gameplay Systems

## Core Stats
- `hp`: health (0-100)
- `hunger`: feeding need (0-100)
- `affection`: emotional care need (0-100)
- `social`: social fulfillment need (0-100)
- `level`, `xp`: progression
- `mood`: derived state from current stats/sleep context (`Joyful`, `Calm`, `Hungry`, `Lonely`, `Sleepy`, `Worn Out`, `Exhausted`)

## Care Actions
- `feed`: hunger + social + XP, 10-minute cooldown
- `pet`: affection + social + XP, 5-minute cooldown
- `play`: affection + social + XP, 10-minute cooldown, optional toy boost
- `cuddle`: affection + social + XP, 8-minute cooldown
- `train`: high XP, consumes hunger/affection, 15-minute cooldown
- `bathe`: hp + affection + social + XP, 20-minute cooldown

## Sleep Scheduling
Each player configures:
- `timezone` (IANA)
- `sleep_start_local` (HH:mm)
- `sleep_duration_hours` (1-9)

Behavior:
- Sleep is evaluated against the player's local clock.
- All actions except `pet` are blocked while asleep.
- `/sleep schedule set` supports timezone autocomplete suggestions and strict validation.

## Decay Rules
On each care tick:
- Hunger decays after feed neglect threshold.
- Affection decays after social-care neglect threshold.
- Social decays after social-play neglect threshold.
- If hunger, affection, or social reaches 0, HP drains.
- If hunger, affection, and social are all maxed, HP can recover.

## Death + Revival
- On HP 0, player profile is removed and death is recorded.
- Economy and progress state persist after death (coins/items are retained).
- `/revive` restores your latest fallen Kiby with:
  - significant Star Coin cost, or
  - one-time revive token safety valve (if available).

## Economy
- `Star Coins` are the primary soft currency.
- Shop categories:
  - consumables (direct stat/XP boosts)
  - toys (used during `/play`, includes fatigue balancing)
  - support items (adventure-only)
- Gifting:
  - coin gifting with transfer fee and daily caps
  - item gifting with daily caps and non-tradable protections

## Daily Progression
- Daily reset is player-local (based on configured timezone).
- Daily streaks use a streak-shield system:
  - 1 shield max
  - refills every 7 days
  - protects one missed day.
- Quest board:
  - 3 rotating daily quests
  - 1 bonus quest
  - 1 reroll per day.

## Titles
- Unlockable cosmetic titles from varied requirements (not only level-based).
- One title can be equipped at a time.
- Equipped title is displayed in leaderboard rows.

## Social Systems
- One-way social play:
  - interact with another player's Kiby name target
  - only your own Kiby gains social/affection
  - no target notification or target stat changes
  - diminishing returns per target/day.
- Direct social interactions:
  - positive-only
  - target must opt in
  - no forced cross-player disruption.

## Events
Two layers run in parallel:
- **Personal random events**: periodic stat impacts on active players.
- **Global campaign events**:
  - shared progress goal
  - per-player contribution tracking
  - claimable completion rewards for contributors.

## Adventures (Async PvE)
- Start adventures with preset durations only.
- Route risk + preparedness + support items determine expected outcome.
- Damage is applied by checkpoint simulation.
- If HP would drop below fail threshold:
  - adventure fails early
  - Kiby returns wounded
  - minimal-to-no rewards.
- Adventures do not kill Kiby directly (HP floor is protected).

## Leaderboards
- `total`: all-time mixed board (players + NPCs)
- `season`: current season board with 7/14-day cadence
- `players` (developer-only): player-only board
- Optional result count: `5/10/15/20`

Sort order:
1. Level (desc)
2. XP (desc)
3. Name (asc)
