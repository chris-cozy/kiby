# Gameplay Systems

## Core Stats
- `hp`: health (0-100)
- `hunger`: feeding need (0-100)
- `affection`: social need (0-100)
- `level`, `xp`: progression

## Actions
- `feed`: +hunger, +xp, 10-minute cooldown
- `pet`: +affection, +xp, 5-minute cooldown
- `play`: +affection, +xp, 10-minute cooldown

## Sleep Scheduling
Each player configures:
- `timezone` (IANA)
- `sleep_start_local` (HH:mm)
- `sleep_duration_hours` (1-9)

Behavior:
- Sleep is evaluated against the player's local clock.
- `feed` and `play` are blocked while asleep.
- `pet` remains available while asleep.

## Decay Rules
On each care tick:
- If neglected beyond threshold:
  - hunger and/or affection decay
- If hunger or affection hits 0:
  - hp decays
- If both hunger and affection are maxed:
  - hp can recover slightly

## Death
When `hp` reaches 0:
- Death is recorded in `DeathHistory`
- Active player profile is removed
- User receives death notification

## NPC Tiers
- `casual`: lighter upkeep, lower progression pressure
- `active`: balanced and consistent activity
- `competitive`: high interaction frequency and faster climb

NPCs are simulated on a scheduled tick with seeded deterministic behavior.

## Economy And Progression
- `Star Coins`: primary soft currency
- Inventory items can restore hunger/affection/hp or accelerate xp gain
- Daily login rewards increase with streak progression
- Daily quests rotate and reward Star Coins upon completion

## World Events
- Periodic global events can affect active players
- Events can boost or reduce specific stats
- Event outcomes are persisted and surfaced through DM notifications

## Leaderboard
A single mixed leaderboard ranks both player and synthetic profiles by:
1. Level (descending)
2. XP (descending)
3. Name (ascending)
