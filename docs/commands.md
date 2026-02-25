# Command Reference (v2.2.0)

## Configuration
- `/adopt name:<name>`: create your Kiby.
- `/revive`: revive your most recent fallen Kiby (token or coin cost).
- `/tutorial start|status|skip|replay`: manage onboarding tutorial runs.
- `/sleep schedule set timezone:<IANA> start:<12 AM ... 11 PM> duration_hours:<1-9>`
- `/sleep schedule view`
- `/sleep schedule clear`
- `/ambient view|set enabled:<true|false>`: Toggle autonomous ambient Kiby moments.

## Care
- `/feed`
- `/pet`
- `/play toy:<optional-toy>`
- `/cuddle`
- `/train`
- `/bathe`

Rules:
- While sleeping: only `/pet` and `/cuddle` are allowed.
- While adventuring: care commands are blocked (`feed/pet/play/cuddle/train/bathe`).

## Economy
- `/shop list`
- `/shop buy item:<item> quantity:<n>`
- `/inventory`
- `/use item:<item>`
- `/gift coins user:<user> amount:<n>`
- `/gift item user:<user> item:<item> quantity:<n>`

Gifting behavior:
- sender success is not rolled back if receiver DM fails.
- receiver gets DM notification when coins/items are received.

## Social
- `/playdate send kiby:<autocomplete>`: direct 1-on-1 playdate with any existing Kiby (player or NPC).
- `/playdate settings opt_in:<true|false>`: allow direct inbound playdates from players.
- `/park send duration:<preset>`
- `/park status`
- `/park leave`

`/playdate send` behavior:
- supports global target list (not limited to current server/channel).
- player-owned targets require opt-in and respect receiver cooldown.
- successful player target visits send best-effort receiver notification DMs.
- NPC targets do not send owner notifications.

`/park` behavior:
- send your Kiby asynchronously for a selected duration.
- longer durations increase social gains and hunger drain.
- `/park status` shows global occupancy + your remaining time.
- if `/park leave` is not used, sessions auto-resolve at duration end.
- `/park leave` resolves completed or early sessions with proportional effects and reveals actual gains/losses.

## Progression
- `/daily`
- `/quests view`
- `/quests claim quest:<slot-1|slot-2|slot-3|bonus>`
- `/quests reroll slot:<1-3>`
- `/titles view`
- `/titles equip title:<title>`
- `/events view`
- `/events claim`
- `/adventure start route:<route> duration:<preset> support_item:<optional>`
- `/adventure status`
- `/adventure claim`
- `/adventure locations`
- `/language`

Adventure embed behavior:
- start/status now show `Danger Level` (single simplified risk signal).
- projected rewards are hidden from status to preserve reward surprise.
- once an adventure has completed, `/adventure claim` must be resolved before additional game actions.

Global event behavior:
- `/events view` can return an idle state when no global campaign event is active.
- `/events claim` can return `no-active-event` when no event is currently running.

## Information
- `/info`
- `/cooldowns` (shows only currently active care cooldown timers)
- `/leaderboard mode:<total|season|players (dev-only)> count:<5|10|15|20>`
- `/feedback category:<bug|balance|feature|ux|other> message:<text>`
- `/help`
- `/ping`

Leaderboard notes:
- `players` mode is developer-restricted.

## Developer
- `/system mode:<active_72h|all_installed> subject:<text> body:<text>`
- `/version`
- `/globalevent start event:<event_key>`

`/system` behavior:
- `active_72h`: targets unique players active in the last 72 hours (DM fanout).
- `all_installed`: targets all known players and attempts one server broadcast per installed guild.
- server broadcast selection order: `systemChannel` -> `publicUpdatesChannel` -> other text/announcement channels, stopping on first successful send per guild.

## Onboarding Telemetry
- Tutorial funnel telemetry is stored in `PlayerProgress.onboarding`.
- Retention and onboarding checks can compare step completion/drop-off versus `lastActionAt` cohorts.
