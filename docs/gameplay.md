# Gameplay Systems (v2.0.0)

## Core Stats
- `hp` (0-100)
- `hunger` (0-100)
- `affection` (0-100)
- `social` (0-100)
- `battlePower` (0-1000)
- `level`, `xp`
- `mood` (derived from stats + sleep context)

## Care Actions
- `feed`: hunger + XP, 10m cooldown
- `pet`: affection + XP, 5m cooldown
- `play`: affection + XP, 10m cooldown, , optional toy boost
- `cuddle`: affection + XP, 8m cooldown
- `train`: XP + battlePower gain, 15m cooldown
- `bathe`: hp + affection + XP, 20m cooldown

Important rules:
- Solo care/item/adventure/passive systems do not grant positive social points.
- Positive social points come only from:
  - `/social play-with`
  - `/social interact`

## Sleep Scheduling
Each player configures:
- `timezone` (IANA)
- `sleep_start_local` (HH:mm)
- `sleep_duration_hours` (1-9)

Behavior:
- Sleep is evaluated against the player's local clock.
- All actions except `pet` and `cuddle` are blocked while asleep.
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

## Adventure Lock Rules
- While a Kiby is actively adventuring, care commands are blocked.
- After the adventure resolves, care unlocks even before `/adventure claim`.

## Battle Power Loop
- `train` is the primary BP growth action.
- BP gain defaults to `+12..18` per successful train.
- Passive BP decay defaults to `3%` per 24h, applied lazily on BP touch.
- Adventures use BP as dominant readiness signal:
  - BP weight: ~70%
  - condition weight (HP/hunger/affection/mood): ~30%

## Adventures (Async PvE)
- Start adventures with preset durations only.
- Route risk + preparedness + support items determine expected outcome.
- Damage is applied by checkpoint simulation.
- If HP would drop below fail threshold:
  - adventure fails early
  - Kiby returns wounded
  - minimal-to-no rewards.
- Adventures do not kill Kiby directly (HP floor is protected).
- Route recommendations (no hard BP start gates):
  - Meadow Patrol: `0`
  - Crystal Cavern: `90`
  - Starfall Ruins: `180`
  - Obsidian Citadel: `300`
- Duration selection is a baseline estimate.
- Actual completion resolves within:
  - earliest: `baseline * 0.75`
  - latest: `baseline * 1.25`
- Low BP increases risk and failure chance materially.
- Failure behavior:
  - adventure ends early
  - Kiby returns wounded
  - minimal-to-no rewards
  - Kiby cannot die directly from adventure resolution (HP floor protected).
- Players are DM-notified once when an adventure becomes claimable.

## Social Systems
- One-way social play:
  - interact with another player's Kiby name target
  - only your own Kiby gains social/affection
  - no target notification or target stat changes
- Direct social interactions:
  - positive-only
  - target must opt in
  - no forced cross-player disruption.

## Events
Two parallel systems:
- Personal random world events (stat impacts).
- Global campaign events:
  - shared objective
  - active-player goal scaling (24h activity window)
  - contributor claim rewards (`/events claim`)
  - developer manual start control (`/globalevent start`).

Global event goal formula:
- `goal = clamp(ceil(activePlayers * 12 * goalMultiplier), min=24, max=2000)`

## Language Progression
- Kiby flavor text appears in Kiby-language tokens.
- Repeated exposure unlocks token translations per player.
- Unknown terms remain tokenized.
- Known terms show glossed output (`token(translation)`).
- Surfaces:
  - mention replies
  - ambient messages
  - adventure flavor lines
  - world/global event snippets.

## Economy / Persistence
- `Star Coins` are the primary soft currency.
- Shop categories:
  - consumables (direct stat/XP boosts)
  - toys (used during `/play`, includes fatigue balancing)
  - support items (adventure-only)
- Gifting:
  - coin gifting with transfer fee and daily caps
  - item gifting with daily caps and non-tradable protections
- Coins and inventory persist even if Kiby dies.
- Gifting has daily limits and fees.
- Receiver notifications are sent on successful gifts.
- Feedback can be submitted directly in-app via `/feedback`.

## Leaderboards
- `total`: all-time mixed board (players + NPCs)
- `season`: current season board with 7/14-day cadence
- `players` (developer-only): player-only board
- Optional result count: `5/10/15/20`

Sort order:
1. Level (desc)
2. XP (desc)
3. Name (asc)

