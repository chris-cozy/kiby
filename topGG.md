# Kiby

Adopt a Kiby, keep it thriving, make friends, and climb long-term living competitive leaderboards + social progression loops.

Kiby is a Discord virtual pet app with where each player raises a personal Kirby through care actions, progression systems, and daily engagement loops. It has care management, economy systems, async adventures, mood-driven interactions, and seasonal leaderboard competition.

## Install Options

Kiby supports both install modes:
- **Server install**: Add Kiby to a guild for shared competition, chat interactions, and leaderboard visibility.
- **User install**: Add Kiby to your Discord apps for direct personal access in DMs/App Home.

## Core Gameplay

- **Adopt** your Kiby with `/adopt`.
- Manage care stats with `/feed`, `/pet`, `/play`, `/cuddle`, `/train`, `/bathe`.
- Configure automatic sleep by timezone with `/sleep schedule set`.
- Track profile, mood, title, and ranking via `/info` + `/cooldowns`.
- Climb the global board with `/leaderboard`.

## Progression + Economy

- Claim local-time daily rewards with streak shields using `/daily`.
- Complete rotating quest boards with `/quests view|claim|reroll`.
- Buy and use item categories with `/shop`, `/inventory`, and `/use`:
  - consumables
  - play toys
  - adventure support gear
- Gift Star Coins or items using `/gift` (recipient gets a DM notification).

## Social + Events

- Direct 1-on-1 playdates with `/playdate send` (player + NPC targets).
- Optional inbound direct-playdate controls via `/playdate settings`.
- `/playdate send` boosts both sides on success, notifies non-NPC owners, and uses receiver-side anti-spam cooldown for player targets.
- Park-based social care loop via `/park send|status|leave` with duration-based gains/drain.
- Social points are earned from true social actions (not solo care/item actions).
- Random personal world events continue to affect active Kibys over time.
- Global campaign events run in parallel and reward contributors (`/events view|claim`).
- Developers can manually start global events with `/globalevent start`.
- Global campaign events now start sporadically with random durations and quiet gaps.
- Active users are notified by DM when a new global campaign event starts.

## Adventures + Seasons

- Launch async adventures with baseline duration options via `/adventure start`.
- Manage risk with prep quality, Battle Power, and support items.
- Adventures can fail early if HP drops below threshold, returning Kiby wounded.
- Route recommendations: Meadow Patrol (0), Crystal Cavern (90), Starfall Ruins (180), Obsidian Citadel (300).
- No hard BP route locks; low BP still increases failure risk significantly.
- ETA is variable (adventures can finish earlier/later than baseline).
- View route activity with `/adventure locations`.
- Compete in both total and seasonal leaderboards.

## Personality + Language

- Mood-aware autonomous behavior and mention replies.
- Kiby-language token system with progressive translation unlocks (`/language`).
- Players can send feedback directly to developers with `/feedback`.

## Notes

- DM access is recommended for reminders, gift notifications, and ambient Kiby moments.
- Kiby is designed as an evolving live service with frequent balancing and content updates.
