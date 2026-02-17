# Command Reference

## Configuration
- `/adopt name:<name>`: Create your Kiby profile.
- `/revive`: Revive your most recent fallen Kiby (coin cost or revive token).
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

## Economy
- `/shop list`
- `/shop buy item:<item> quantity:<n>`
- `/inventory`
- `/use item:<item>`
- `/gift coins user:<user> amount:<n>`
- `/gift item user:<user> item:<item> quantity:<n>`

## Social
- `/social play-with user:<user>`: One-way social play (no target notification or stat impact).
- `/social interact user:<user> action:<cheer|encourage|wave>`: Direct opt-in interaction.
- `/social settings opt_in:<true|false>`: Allow direct interactions from others.

## Progression
- `/daily`
- `/quests view`
- `/quests claim quest:<slot-1|slot-2|slot-3|bonus>`
- `/quests reroll slot:<1-3>`
- `/titles view`
- `/titles equip title:<title>`
- `/events view|claim`
- `/adventure start route:<route> duration:<preset> support_item:<optional>`
- `/adventure status`
- `/adventure claim`

## Information
- `/info`
- `/cooldowns`
- `/leaderboard mode:<total|season|players-dev-only> count:<5|10|15|20>`
- `/help`
- `/ping`

## Developer
- `/system subject:<text> body:<text>` (developer-only)
