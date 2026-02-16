# Changelog

All notable changes to this project are documented in this file.

## [2.0.0] - 2026-02-15
### Added
- Domain/service/repository architecture for care, sleep scheduling, progression, NPC simulation, and leaderboard composition.
- Timezone-configurable automatic sleep schedules with `/sleep schedule set|view|clear` and a strict maximum of 9 hours per sleep window.
- New data models: `PlayerProfile`, `SleepSchedule`, `NpcProfile`, `DeathHistory`, `PlayerEconomy`, and `PlayerProgress`.
- Seeded NPC ecosystem (36 baseline participants across casual, active, and competitive tiers) with deterministic hourly simulation.
- Mixed leaderboard that combines real users and seeded participants.
- New progression/economy systems:
  - `/shop` (list/buy)
  - `/inventory`
  - `/use`
  - `/daily`
  - `/quests` (view/claim)
- World event engine with periodic random events affecting active player Kibys.
- Health endpoint (`/health`), structured logging, and graceful shutdown handling.
- Docker and Docker Compose deployment workflow.
- Testing/linting/CI scaffolding and domain test coverage.
- Production environment template `.env.production.example` and expanded system docs.

### Changed
- Slash command handling rewritten for safer lifecycle semantics (`defer/reply/edit`) and consistent permission enforcement.
- Legacy manual sleep command semantics replaced by schedule-based automatic sleep evaluation.
- Care tick logic refactored into domain rules and scheduler services.
- Command and media loading optimized with caching and deterministic ordering.
- Legacy pre-v2 schema/util modules retired.

### Security
- Kirby name sanitization to reduce mention abuse and unsafe formatting.
- Environment validation with fail-fast startup behavior.
- Safer DM failure handling and outbound notification guardrails.

## [1.0.0] - 2023-04-11
### Added
- Initial Discord bot setup.
- Early Kirby interaction baseline.

### Legacy History Included In The 1.0.0 Baseline
#### 3.11.2 - 2023-07-30
- Reorganized files.
- Added error catching and handling for sending message replies.

#### 3.11.1 - 2023-07-28
- Decreased random message send frequency.
- Added stronger DM send error handling.

#### 3.11.0 - 2023-07-18
- Updated deprecated user tag handling in leaderboard display.
- Updated DM sending methods.

#### 3.10.0 - 2023-06-07
- Implemented revive developer command.
- Decreased HP losses.
- Added release notes.

#### 3.9.1 - 2023-06-06
- Bug fixes.
- Reduced hunger and affection point losses.

#### 3.9.0 - 2023-06-06
- Bug fixes.
- Implemented top.gg stats posting feature.

#### 3.8.3 - 2023-06-05
- Updated DMs to show each user's Kirby.
- Decreased health loss rate.

#### 3.8.2 - 2023-06-05
- Optimized the codebase.
- Added random Kirby DM messages during care checks.
- Fixed ephemerality reversal bug.
- Fixed dead Kirby save bug.
- Stopped attempting DMs to users with DMs disabled.

#### 3.8.0 - 2023-06-04
- Updated bot status.
- Added dead Kirby data retention.

#### 3.7.0 - 2023-06-04
- Rebalanced care checking (HP drain, hunger drain, affection drain).
- Updated leaderboard to bold the requestor when present.
- Added help command.

#### 3.6.0 - 2023-06-04
- Updated leaderboard total count display.
- Renamed leaderboard.
- Updated feed cooldown messaging when full.
- Updated sleep command display text.
- Simplified cooldown display format.
- Rebalanced care checking cadence and drains.

#### 3.5.0 - 2023-06-03
- Switched from username display to discriminator for privacy.
- Fixed feed cooldown bug.
- Updated invite link.
- Decreased feed cooldown.
- Removed hunger gain tied to cooldown behavior.
- Replaced cooldown dates with countdown timers.
- Increased sleep duration to 9 hours.
- Added hunger, affection, and death notifications.
- Updated ephemeral settings.

#### 3.4.0 - 2023-05-18
- Cleaned and optimized code.
- Added more Kirby media.

#### 3.3.0 - 2023-05-01
- Added cooldowns command.
- Fixed bugs.

#### 3.0.6 - 2023-04-30
- Added sleep command.
- Differentiated pet and play cooldowns.
- Added pink embed styling standard.
- Added leaderboard command.
- Updated info card design.

#### 3.0.4 - 2023-04-27
- Added HP healing when needs are met.
- Changed DM ephemerality behavior for care commands.
- Updated info command.
- Updated adopt command.
- Added additional media.
- General code cleanup.

#### 3.0.0 - 2023-04-25
- Added feed command.
- Added play command.
- Added pet command.
- Replaced Tenor GIFs with local media.

#### 2.1.0 - 2023-04-24
- Added care/health decay and death.
- Added last-care date tracking.

#### 2.0.0 - 2023-04-24
- Added info command.
- Added Tenor GIF API support.
- Added database-backed state retention.
- Added configure command.

#### 1.1.0 - 2023-04-11
- Removed OpenAI API integration.
- Added Kirby lexicon chat system.

#### 1.0.0 - 2023-04-11
- Project initialization.
- Early OpenAI-backed chat integration.
