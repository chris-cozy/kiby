# Command Reference (v2.0.0)

## Configuration
- `/adopt name:<name>`: create your Kiby.
- `/revive`: revive your most recent fallen Kiby (token or coin cost).
- `/sleep schedule set timezone:<IANA> start:<HH:mm> duration_hours:<1-9>`
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

## Information
- `/info`
- `/cooldowns`
- `/leaderboard mode:<total|season|players (dev-only)> count:<5|10|15|20>`
- `/feedback category:<bug|balance|feature|ux|other> message:<text>`
- `/help`
- `/ping`

Leaderboard notes:
- `players` mode is developer-restricted.

## Developer
- `/system subject:<text> body:<text>`
- `/globalevent start event:<event_key>`
