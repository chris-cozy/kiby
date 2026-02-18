jest.mock("../../src/config/env", () => ({
  globalEventActivePlayerWindowHours: 24,
  globalEventTargetPerActive: 12,
  globalEventGoalMin: 24,
  globalEventGoalMax: 2000,
  globalEventDurationMinHours: 24,
  globalEventDurationMaxHours: 72,
  globalEventIdleGapMinHours: 24,
  globalEventIdleGapMaxHours: 48,
  globalEventStartChancePerTickPercent: 35,
}));

jest.mock("../../src/repositories/globalEventRepository", () => ({
  findActive: jest.fn(),
  createEvent: jest.fn(),
  saveEvent: jest.fn(),
  findByEventId: jest.fn(),
  findLatestCompletedUnannounced: jest.fn(),
}));

jest.mock("../../src/repositories/globalEventCycleRepository", () => ({
  getSingleton: jest.fn(),
  saveCycleState: jest.fn(),
}));

jest.mock("../../src/repositories/playerProgressRepository", () => ({
  countActiveSince: jest.fn(),
  listActiveSince: jest.fn(),
}));

jest.mock("../../src/repositories/playerRepository", () => ({
  findByUserId: jest.fn(),
}));

jest.mock("../../src/services/economyService", () => ({
  ensureEconomy: jest.fn(),
}));

jest.mock("../../src/services/progressionService", () => ({
  recordWorldEventContribution: jest.fn(),
}));

jest.mock("../../src/services/seasonService", () => ({
  recordEntityProgress: jest.fn(),
}));

const globalEventRepository = require("../../src/repositories/globalEventRepository");
const globalEventCycleRepository = require("../../src/repositories/globalEventCycleRepository");
const playerProgressRepository = require("../../src/repositories/playerProgressRepository");
const progressionService = require("../../src/services/progressionService");
const globalEventService = require("../../src/services/globalEventService");

describe("globalEventService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns no-active-event when recording contribution without active event", async () => {
    globalEventRepository.findActive.mockResolvedValue(null);

    const result = await globalEventService.recordContribution("user-1", 2, new Date());

    expect(result).toEqual({
      ok: false,
      reason: "no-active-event",
    });
    expect(progressionService.recordWorldEventContribution).not.toHaveBeenCalled();
  });

  it("returns inactive status with next eligible metadata when no event is active", async () => {
    const nextEligibleAt = new Date("2026-02-20T12:00:00.000Z");
    globalEventRepository.findActive.mockResolvedValue(null);
    globalEventCycleRepository.getSingleton.mockResolvedValue({
      nextEligibleAt,
      save: jest.fn(),
    });

    const status = await globalEventService.getGlobalEventStatus("user-1", new Date());

    expect(status.active).toBe(false);
    expect(new Date(status.nextEligibleAt).toISOString()).toBe(nextEligibleAt.toISOString());
    expect(status.startChancePerTickPercent).toBe(35);
  });

  it("does not schedule start before nextEligibleAt", async () => {
    const now = new Date("2026-02-18T12:00:00.000Z");
    globalEventRepository.findActive.mockResolvedValue(null);
    globalEventCycleRepository.getSingleton.mockResolvedValue({
      nextEligibleAt: new Date("2026-02-19T00:00:00.000Z"),
      save: jest.fn(),
    });

    const result = await globalEventService.maybeStartScheduledGlobalEvent(now);

    expect(result.started).toBe(false);
    expect(result.reason).toBe("not-eligible");
    expect(globalEventRepository.createEvent).not.toHaveBeenCalled();
  });

  it("starts scheduled event when eligible and chance passes", async () => {
    const now = new Date("2026-02-18T12:00:00.000Z");
    const cycleSave = jest.fn();
    const cycle = {
      nextEligibleAt: new Date("2026-02-18T11:00:00.000Z"),
      save: cycleSave,
    };
    const createdEvent = {
      eventId: "event-1",
      key: "dream-orchard",
      title: "Dream Orchard Festival",
      description: "desc",
      startedAt: now,
      endsAt: new Date("2026-02-19T12:00:00.000Z"),
      goal: 42,
      scalingSnapshot: {
        activePlayers: 3,
      },
    };

    globalEventRepository.findActive.mockResolvedValue(null);
    globalEventCycleRepository.getSingleton.mockResolvedValue(cycle);
    playerProgressRepository.countActiveSince.mockResolvedValue(3);
    playerProgressRepository.listActiveSince.mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
    ]);
    globalEventRepository.createEvent.mockResolvedValue(createdEvent);

    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
    const result = await globalEventService.maybeStartScheduledGlobalEvent(now);
    randomSpy.mockRestore();

    expect(result.started).toBe(true);
    expect(result.event.eventId).toBe("event-1");
    expect(result.activeUserIds).toEqual(["u1", "u2"]);
    expect(globalEventRepository.createEvent).toHaveBeenCalled();
    expect(globalEventCycleRepository.saveCycleState).toHaveBeenCalled();
  });
});
