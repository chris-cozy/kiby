# Command Reference (v2.1.1)

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
- `/social play-with user:<user>`: one-way social action (no target notification).
- `/social interact user:<user> action:<cheer|encourage|wave>`: direct interaction (target opt-in required).
- `/social settings opt_in:<true|false>`: Allow direct interactions from others.

`/social interact` behavior:
- applies sender gain + receiver Kiby gains on success.
- sends a best-effort receiver DM notification on success.
- enforces sender cooldown and receiver-side anti-spam cooldown.
- returns `target-cooldown` with remaining wait when receiver recently got an inbound interaction.

`/social play-with` behavior:
- remains one-way/no-notify and does not apply receiver stat changes.

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
