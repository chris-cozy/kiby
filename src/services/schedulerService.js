const env = require("../config/env");
const careService = require("./careService");
const npcService = require("./npcService");
const eventService = require("./eventService");
const globalEventService = require("./globalEventService");
const adventureService = require("./adventureService");
const notificationService = require("./notificationService");
const ambientService = require("./ambientService");
const seasonService = require("./seasonService");
const logger = require("../utils/logger");

function createScheduler(client) {
  const timers = [];

  async function runCareTick() {
    const result = await careService.runPlayerDecayTick(new Date());

    for (const notice of result.notifications) {
      await notificationService.sendNeedNotification(
        client,
        notice.type,
        notice.userId,
        notice.kirbyName
      );
    }

    for (const death of result.deaths) {
      await notificationService.sendNeedNotification(
        client,
        "death",
        death.userId,
        death.kirbyName
      );
    }

    logger.info("Completed care tick", {
      players: result.playerCount,
      notifications: result.notifications.length,
      deaths: result.deaths.length,
    });
  }

  async function runNpcTick() {
    const result = await npcService.runNpcTick(new Date());
    logger.info("Completed npc tick", {
      npcs: result.npcCount,
      deaths: result.deaths,
    });
  }

  async function runWorldEventTick() {
    const result = await eventService.runWorldEventTick(
      new Date(),
      env.worldEventChancePercent / 100
    );
    if (!result.triggered) {
      logger.debug("World event tick skipped", { reason: result.reason });
      return;
    }

    await notificationService.sendWorldEventNotification(
      client,
      result.userId,
      result.kirbyName,
      {
        key: result.event.key,
        title: result.event.title,
        description: result.event.description,
        delta: result.delta,
      }
    );

    logger.info("World event triggered", {
      userId: result.userId,
      event: result.event.key,
      delta: result.delta,
    });
  }

  async function runAmbientTick() {
    const result = await ambientService.runAmbientTick(client, new Date());
    logger.debug("Completed ambient tick", {
      players: result.playerCount,
      sent: result.sent,
    });
  }

  async function runGlobalEventMonitorTick() {
    const completedEvent = await globalEventService.getCompletedUnannouncedEvent();
    if (!completedEvent) {
      return;
    }

    const contributionMap = completedEvent.contributions || {};
    const contributorIds =
      typeof contributionMap.keys === "function"
        ? Array.from(contributionMap.keys())
        : Object.keys(
            typeof contributionMap.toJSON === "function"
              ? contributionMap.toJSON()
              : contributionMap
          );
    for (const userId of contributorIds) {
      await notificationService.sendGlobalEventCompletionNotification(
        client,
        userId,
        {
          key: completedEvent.key,
          title: completedEvent.title,
        }
      );
    }

    await globalEventService.markEventCompletionAnnounced(completedEvent.eventId);
    logger.info("Announced global event completion", {
      eventId: completedEvent.eventId,
      contributors: contributorIds.length,
    });
  }

  async function runGlobalEventStartTick() {
    const result = await globalEventService.maybeStartScheduledGlobalEvent(new Date());
    if (!result.started) {
      logger.debug("Global event start tick skipped", {
        reason: result.reason,
      });
      return;
    }

    let delivered = 0;
    let failed = 0;
    for (const userId of result.activeUserIds) {
      const sent = await notificationService.sendGlobalEventStartNotification(
        client,
        userId,
        result.event
      );
      if (sent) {
        delivered += 1;
      } else {
        failed += 1;
      }
    }

    logger.info("Global event started", {
      eventId: result.event.eventId,
      key: result.event.key,
      durationHours: result.durationHours,
      goal: result.event.goal,
      activeUsers: result.activeUserIds.length,
      notificationsDelivered: delivered,
      notificationsFailed: failed,
      nextEligibleAt: result.nextEligibleAt,
    });
  }

  async function runAdventureMonitorTick() {
    const notifications = await adventureService.pullReadyCompletionNotifications(
      new Date()
    );
    if (!notifications.length) {
      return;
    }

    for (const notice of notifications) {
      const route = adventureService.ROUTES.find(
        (candidate) => candidate.id === notice.routeId
      );
      await notificationService.sendAdventureReadyNotification(client, notice.userId, {
        routeLabel: notice.routeLabel,
        status: notice.status,
        routeMediaKey: route?.mediaKey || "",
        routeCompleteMediaKey: (route?.mediaKey || "").replace(
          /^adventure\//,
          "adventure_complete/"
        ),
      });
    }

    logger.info("Adventure completion notifications sent", {
      count: notifications.length,
    });
  }

  async function start() {
    const seeded = await npcService.ensureNpcSeeded();
    logger.info("NPC seed status", seeded);
    await seasonService.ensureSeasonState(new Date());

    await runCareTick().catch((error) => {
      logger.error("Care tick failed during startup", { error: error.message });
    });
    await runNpcTick().catch((error) => {
      logger.error("NPC tick failed during startup", { error: error.message });
    });
    await runWorldEventTick().catch((error) => {
      logger.error("World event tick failed during startup", {
        error: error.message,
      });
    });
    await runAmbientTick().catch((error) => {
      logger.error("Ambient tick failed during startup", { error: error.message });
    });
    await runGlobalEventStartTick().catch((error) => {
      logger.error("Global event start tick failed during startup", {
        error: error.message,
      });
    });
    await runGlobalEventMonitorTick().catch((error) => {
      logger.error("Global event monitor failed during startup", {
        error: error.message,
      });
    });
    await runAdventureMonitorTick().catch((error) => {
      logger.error("Adventure monitor failed during startup", {
        error: error.message,
      });
    });

    timers.push(
      setInterval(() => {
        runCareTick().catch((error) => {
          logger.error("Care tick failed", { error: error.message });
        });
      }, env.careTickMinutes * 60 * 1000),
      setInterval(() => {
        runNpcTick().catch((error) => {
          logger.error("NPC tick failed", { error: error.message });
        });
      }, env.npcTickMinutes * 60 * 1000),
      setInterval(() => {
        runWorldEventTick().catch((error) => {
          logger.error("World event tick failed", { error: error.message });
        });
      }, env.careTickMinutes * 60 * 1000),
      setInterval(() => {
        runAmbientTick().catch((error) => {
          logger.error("Ambient tick failed", { error: error.message });
        });
      }, env.npcTickMinutes * 60 * 1000),
      setInterval(() => {
        runGlobalEventStartTick().catch((error) => {
          logger.error("Global event start tick failed", { error: error.message });
        });
      }, env.careTickMinutes * 60 * 1000),
      setInterval(() => {
        runGlobalEventMonitorTick().catch((error) => {
          logger.error("Global event monitor failed", { error: error.message });
        });
      }, env.careTickMinutes * 60 * 1000),
      setInterval(() => {
        runAdventureMonitorTick().catch((error) => {
          logger.error("Adventure monitor failed", { error: error.message });
        });
      }, env.careTickMinutes * 60 * 1000)
    );
  }

  function stop() {
    for (const timer of timers) {
      clearInterval(timer);
    }
  }

  return {
    start,
    stop,
  };
}

module.exports = {
  createScheduler,
};
