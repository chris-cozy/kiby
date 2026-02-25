const playerProgressRepository = require("../repositories/playerProgressRepository");
const progressionService = require("./progressionService");

const ONBOARDING_VERSION = 3;
const REQUIRED_STEPS = [
  "care",
  "sleep",
  "training",
  "park-send",
  "park-leave",
  "playdate-settings",
  "playdate",
  "adventure",
  "economy",
  "leaderboard",
];
const OPTIONAL_STEPS = [];
const ALL_STEP_KEYS = [...REQUIRED_STEPS, ...OPTIONAL_STEPS];

const STEP_LABELS = {
  care: "Care System",
  sleep: "Sleep Schedule + World Events",
  training: "Training + Battle Power",
  "park-send": "Park Send",
  "park-leave": "Park Leave",
  "playdate-settings": "Playdate Preferences",
  playdate: "Playdate",
  adventure: "Adventure System",
  economy: "Economy System",
  leaderboard: "Leaderboard + Community",
};

function buildEmptySteps() {
  return {
    care: null,
    sleep: null,
    training: null,
    "park-send": null,
    "park-leave": null,
    "playdate-settings": null,
    playdate: null,
    adventure: null,
    economy: null,
    leaderboard: null,
    // Legacy optional step key retained for old rows.
    social: null,
  };
}

function buildDefaultRun() {
  return {
    runId: "",
    version: ONBOARDING_VERSION,
    source: "",
    status: "none",
    startedAt: null,
    endedAt: null,
    currentStep: REQUIRED_STEPS[0],
    steps: buildEmptySteps(),
    economyInteraction: "",
    helpViewedAt: null,
    infoViewedAt: null,
    cooldownsViewedAt: null,
    recapShownAt: null,
  };
}

function buildDefaultOnboarding() {
  return {
    adoptionCount: 0,
    firstAdoptedAt: null,
    lastAdoptedAt: null,
    runsStarted: 0,
    runsCompleted: 0,
    runsSkipped: 0,
    latestRun: buildDefaultRun(),
  };
}

function ensureStepShape(steps) {
  const target = steps || {};
  for (const key of ALL_STEP_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = null;
    }
  }
  return target;
}

function ensureRunShape(run) {
  const target = run || buildDefaultRun();
  target.runId = target.runId || "";
  target.version = Number.isFinite(target.version) ? target.version : ONBOARDING_VERSION;
  target.source = target.source || "";
  target.status = ["none", "active", "completed", "skipped"].includes(target.status)
    ? target.status
    : "none";
  target.startedAt = target.startedAt || null;
  target.endedAt = target.endedAt || null;
  target.currentStep = target.currentStep || REQUIRED_STEPS[0];
  target.steps = ensureStepShape(target.steps);
  target.economyInteraction = target.economyInteraction || "";
  target.helpViewedAt = target.helpViewedAt || null;
  target.infoViewedAt = target.infoViewedAt || null;
  target.cooldownsViewedAt = target.cooldownsViewedAt || null;
  target.recapShownAt = target.recapShownAt || null;
  return target;
}

function ensureOnboardingShape(progress) {
  progress.onboarding = progress.onboarding || buildDefaultOnboarding();
  const onboarding = progress.onboarding;

  onboarding.adoptionCount = Number.isFinite(onboarding.adoptionCount)
    ? onboarding.adoptionCount
    : 0;
  onboarding.firstAdoptedAt = onboarding.firstAdoptedAt || null;
  onboarding.lastAdoptedAt = onboarding.lastAdoptedAt || null;
  onboarding.runsStarted = Number.isFinite(onboarding.runsStarted)
    ? onboarding.runsStarted
    : 0;
  onboarding.runsCompleted = Number.isFinite(onboarding.runsCompleted)
    ? onboarding.runsCompleted
    : 0;
  onboarding.runsSkipped = Number.isFinite(onboarding.runsSkipped)
    ? onboarding.runsSkipped
    : 0;
  onboarding.latestRun = ensureRunShape(onboarding.latestRun);
  return onboarding;
}

function getNextRequiredStep(run) {
  for (const key of REQUIRED_STEPS) {
    if (!run.steps[key]) {
      return key;
    }
  }
  return "";
}

function toRunId(now = new Date()) {
  return `run-${now.getTime()}-${Math.floor(Math.random() * 100000)}`;
}

function createActiveRun(source, now = new Date()) {
  return {
    runId: toRunId(now),
    version: ONBOARDING_VERSION,
    source: source || "manual-start",
    status: "active",
    startedAt: now,
    endedAt: null,
    currentStep: REQUIRED_STEPS[0],
    steps: buildEmptySteps(),
    economyInteraction: "",
    helpViewedAt: null,
    infoViewedAt: null,
    cooldownsViewedAt: null,
    recapShownAt: null,
  };
}

function serializeSteps(run) {
  return REQUIRED_STEPS.map((key) => ({
    key,
    label: STEP_LABELS[key],
    required: true,
    completed: Boolean(run.steps[key]),
    completedAt: run.steps[key] || null,
  })).concat(
    OPTIONAL_STEPS.map((key) => ({
      key,
      label: STEP_LABELS[key],
      required: false,
      completed: Boolean(run.steps[key]),
      completedAt: run.steps[key] || null,
    }))
  );
}

function buildStatusSnapshot(onboarding) {
  const run = ensureRunShape(onboarding.latestRun);
  const nextRequiredStep = run.status === "active" ? getNextRequiredStep(run) : "";
  const stepRows = serializeSteps(run);
  const requiredCompletedCount = stepRows.filter(
    (row) => row.required && row.completed
  ).length;

  return {
    version: ONBOARDING_VERSION,
    adoptionCount: onboarding.adoptionCount,
    firstAdoptedAt: onboarding.firstAdoptedAt,
    lastAdoptedAt: onboarding.lastAdoptedAt,
    runsStarted: onboarding.runsStarted,
    runsCompleted: onboarding.runsCompleted,
    runsSkipped: onboarding.runsSkipped,
    latestRun: {
      runId: run.runId,
      version: run.version,
      source: run.source,
      status: run.status,
      startedAt: run.startedAt,
      endedAt: run.endedAt,
      currentStep: run.currentStep,
      nextRequiredStep,
      requiredStepsTotal: REQUIRED_STEPS.length,
      requiredStepsCompleted: requiredCompletedCount,
      stepRows,
      economyInteraction: run.economyInteraction,
      helpViewedAt: run.helpViewedAt,
      infoViewedAt: run.infoViewedAt,
      cooldownsViewedAt: run.cooldownsViewedAt,
      recapShownAt: run.recapShownAt,
    },
  };
}

function markStep(run, key, now = new Date()) {
  if (!ALL_STEP_KEYS.includes(key)) {
    return false;
  }

  if (run.steps[key]) {
    return false;
  }

  run.steps[key] = now;
  return true;
}

function applyEventToRun(run, eventKey, payload, now = new Date()) {
  let changed = false;

  if (eventKey === "care-action") {
    changed = markStep(run, "care", now) || changed;
    if (payload?.actionName === "train") {
      changed = markStep(run, "training", now) || changed;
    }
  } else if (eventKey === "training-action") {
    changed = markStep(run, "care", now) || changed;
    changed = markStep(run, "training", now) || changed;
  } else if (eventKey === "park-send") {
    changed = markStep(run, "park-send", now) || changed;
  } else if (eventKey === "park-leave") {
    changed = markStep(run, "park-leave", now) || changed;
  } else if (eventKey === "playdate-settings") {
    changed = markStep(run, "playdate-settings", now) || changed;
  } else if (eventKey === "playdate-action") {
    changed = markStep(run, "playdate", now) || changed;
  } else if (eventKey === "sleep-set") {
    changed = markStep(run, "sleep", now) || changed;
  } else if (eventKey === "adventure-start") {
    changed = markStep(run, "adventure", now) || changed;
  } else if (eventKey === "economy-interaction") {
    changed = markStep(run, "economy", now) || changed;
    if (payload?.interaction && !run.economyInteraction) {
      run.economyInteraction = payload.interaction;
      changed = true;
    }
  } else if (eventKey === "leaderboard-view") {
    changed = markStep(run, "leaderboard", now) || changed;
  } else if (eventKey === "help-view" && !run.helpViewedAt) {
    run.helpViewedAt = now;
    changed = true;
  } else if (eventKey === "info-view" && !run.infoViewedAt) {
    run.infoViewedAt = now;
    changed = true;
  } else if (eventKey === "cooldowns-view" && !run.cooldownsViewedAt) {
    run.cooldownsViewedAt = now;
    changed = true;
  } else if (eventKey === "recap-shown" && !run.recapShownAt) {
    run.recapShownAt = now;
    changed = true;
  }

  return changed;
}

function reconcileRunCompletion(onboarding, run, now = new Date()) {
  const nextRequiredStep = getNextRequiredStep(run);
  const previousStep = run.currentStep;

  if (!nextRequiredStep) {
    if (run.status === "active") {
      run.status = "completed";
      run.endedAt = run.endedAt || now;
      run.currentStep = "completed";
      onboarding.runsCompleted += 1;
      return {
        advanced: previousStep !== run.currentStep,
        completedNow: true,
      };
    }

    return {
      advanced: previousStep !== run.currentStep,
      completedNow: false,
    };
  }

  run.currentStep = nextRequiredStep;
  return {
    advanced: previousStep !== run.currentStep,
    completedNow: false,
  };
}

async function getProgressAndOnboarding(userId, now = new Date()) {
  const { progress } = await progressionService.ensureProgress(userId, now);
  const onboarding = ensureOnboardingShape(progress);
  return {
    progress,
    onboarding,
  };
}

async function registerAdoption(userId, now = new Date()) {
  const { progress, onboarding } = await getProgressAndOnboarding(userId, now);
  onboarding.adoptionCount += 1;
  onboarding.lastAdoptedAt = now;
  if (!onboarding.firstAdoptedAt) {
    onboarding.firstAdoptedAt = now;
  }

  await playerProgressRepository.saveProgress(progress);
  return {
    ok: true,
    isFirstAdoption: onboarding.adoptionCount === 1,
    status: buildStatusSnapshot(onboarding),
  };
}

async function startTutorial(userId, source = "manual-start", now = new Date()) {
  const { progress, onboarding } = await getProgressAndOnboarding(userId, now);
  const current = ensureRunShape(onboarding.latestRun);
  const shouldReplay = source === "manual-replay";
  const shouldResume = current.status === "active" && !shouldReplay;

  if (shouldResume) {
    return {
      ok: true,
      startedNew: false,
      resumed: true,
      status: buildStatusSnapshot(onboarding),
    };
  }

  onboarding.latestRun = createActiveRun(source, now);
  onboarding.runsStarted += 1;
  await playerProgressRepository.saveProgress(progress);

  return {
    ok: true,
    startedNew: true,
    resumed: false,
    status: buildStatusSnapshot(onboarding),
  };
}

async function skipTutorial(userId, source = "manual-skip", now = new Date()) {
  const { progress, onboarding } = await getProgressAndOnboarding(userId, now);
  const run = ensureRunShape(onboarding.latestRun);

  if (run.status !== "active") {
    return {
      ok: false,
      reason: "no-active-run",
      status: buildStatusSnapshot(onboarding),
    };
  }

  run.status = "skipped";
  run.source = run.source || source;
  run.endedAt = now;
  run.currentStep = "skipped";
  onboarding.runsSkipped += 1;
  await playerProgressRepository.saveProgress(progress);

  return {
    ok: true,
    status: buildStatusSnapshot(onboarding),
  };
}

async function getStatus(userId, now = new Date()) {
  const { onboarding } = await getProgressAndOnboarding(userId, now);
  return {
    ok: true,
    status: buildStatusSnapshot(onboarding),
  };
}

async function recordEvent(userId, eventKey, payload = {}, now = new Date()) {
  const { progress, onboarding } = await getProgressAndOnboarding(userId, now);
  const run = ensureRunShape(onboarding.latestRun);
  const active = run.status === "active";
  const canRecordRecap = eventKey === "recap-shown";

  if (!active && !canRecordRecap) {
    return {
      ok: true,
      changed: false,
      shouldPrompt: false,
      completedNow: false,
      status: buildStatusSnapshot(onboarding),
    };
  }

  const changed = applyEventToRun(run, eventKey, payload, now);
  if (!changed) {
    return {
      ok: true,
      changed: false,
      shouldPrompt: false,
      completedNow: false,
      status: buildStatusSnapshot(onboarding),
    };
  }

  let completion = {
    advanced: false,
    completedNow: false,
  };
  if (active) {
    completion = reconcileRunCompletion(onboarding, run, now);
  }

  await playerProgressRepository.saveProgress(progress);
  return {
    ok: true,
    changed: true,
    shouldPrompt: completion.advanced || completion.completedNow,
    completedNow: completion.completedNow,
    status: buildStatusSnapshot(onboarding),
  };
}

function getCurrentPrompt(statusPayload) {
  const status = statusPayload?.status || statusPayload;
  const run = status?.latestRun;
  if (!run || run.status !== "active") {
    return null;
  }

  const stepKey = run.nextRequiredStep || run.currentStep;
  const stepNumber = REQUIRED_STEPS.indexOf(stepKey) + 1;
  if (stepNumber < 1) {
    return null;
  }

  const prefix = `**Tutorial ${stepNumber}/${REQUIRED_STEPS.length} - ${STEP_LABELS[stepKey]}**`;
  const skipLine = "Use `/tutorial skip` to exit anytime.";

  if (stepKey === "care") {
    return {
      stepKey,
      stepNumber,
      action: "/pet",
      content: `${prefix}\nIn Dream Land, your Kiby stays healthy when care commands are used regularly.\n**Action:** Use \`/pet\` once.\nAvailable care commands: \`/feed\`, \`/pet\`, \`/play\`, \`/cuddle\`, \`/train\`, \`/bathe\`.\n*Tip:* \`/info\` shows your Kiby's core stats, level progress, and adoption date at a glance.\n*Tip:* \`/cooldowns\` shows only active care cooldowns and exactly how long each has left.\n${skipLine}`,
    };
  }

  if (stepKey === "sleep") {
    return {
      stepKey,
      stepNumber,
      action: "/sleep schedule set",
      content: `${prefix}\nDream Land follows your local day-night rhythm, so your Kiby needs a real bedtime.\n**Action:** Set your schedule with \`/sleep schedule set timezone:<IANA> start:<12 AM to 11 PM> duration_hours:<1-9>\`.\n*Tip:* World events can shift stats; check \`/events view\` and rewards via \`/events claim\`.\n${skipLine}`,
    };
  }

  if (stepKey === "training") {
    return {
      stepKey,
      stepNumber,
      action: "/train",
      content: `${prefix}\nKibys in Dream Land grow stronger through training before they face dangerous routes.\n**Action:** Use \`/train\` once.\n*Tip:* Battle Power is your main adventure readiness signal and decays over time.\n${skipLine}`,
    };
  }

  if (stepKey === "park-send") {
    return {
      stepKey,
      stepNumber,
      action: "/park send",
      content: `${prefix}\nSocial care now includes park time so your Kiby can recharge community energy.\n**Action:** Use \`/park send duration:30\` once.\n*Tip:* Longer park visits grant more social points but drain more hunger.\n${skipLine}`,
    };
  }

  if (stepKey === "park-leave") {
    return {
      stepKey,
      stepNumber,
      action: "/park leave",
      content: `${prefix}\nYour Kiby returns from the park only when you resolve the visit.\n**Action:** Use \`/park leave\` once.\n*Tip:* \`/park status\` shows park occupancy and your remaining time.\n${skipLine}`,
    };
  }

  if (stepKey === "playdate") {
    return {
      stepKey,
      stepNumber,
      action: "/playdate send",
      content: `${prefix}\nDirect 1-on-1 playdates build trust and complete social care onboarding.\n**Action:** Use \`/playdate send\` and choose a Kiby to send {{KIBY_NAME}} on a playdate with\n*Tip:* Players need to opt-in to allow playdates\n${skipLine}`,
    };
  }

  if (stepKey === "playdate-settings") {
    return {
      stepKey,
      stepNumber,
      action: "/playdate settings",
      content: `${prefix}\nSet your direct playdate preference so you control inbound social visits.\n**Action:** Use \`/playdate settings opt_in:<true|false>\` once.\n*Tip:* Keep it enabled to receive player playdates, or disable it to prevent them\n${skipLine}`,
    };
  }

  if (stepKey === "adventure") {
    return {
      stepKey,
      stepNumber,
      action: "/adventure start",
      content: `${prefix}\nBeyond town, Dream Land routes test your Kiby's preparedness and reward steady progression.\n**Action:** Start one run with \`/adventure start route:meadow_patrol duration:30\`.\n*Tip:* Track with \`/adventure status\`, then resolve with \`/adventure claim\`.\n${skipLine}`,
    };
  }

  if (stepKey === "economy") {
    return {
      stepKey,
      stepNumber,
      action: "/daily",
      content: `${prefix}\nStar Coins power Dream Land's economy, letting you buy tools and keep momentum.\n**Action:** Use \`/daily\` once.\n*Tip:* Economy step also accepts \`/quests view\`, \`/shop list\`, or \`/inventory\`.\n${skipLine}`,
    };
  }

  if (stepKey === "leaderboard") {
    return {
      stepKey,
      stepNumber,
      action: "/leaderboard",
      content: `${prefix}\nDream Land is shared with other Kibys, and the leaderboard is where friendly competition comes alive.\n**Action:** Use \`/leaderboard\` once.\n*Tip:* Check \`mode:season\` to track the current race and compare your growth over time.\n${skipLine}`,
    };
  }

  return null;
}

function getCompletionRecap(statusPayload) {
  const status = statusPayload?.status || statusPayload;
  const run = status?.latestRun;
  if (!run || run.status !== "completed") {
    return null;
  }

  return {
    content:
      "**Tutorial Complete**\n" +
      "Next steps checklist:\n" +
      "- Run care actions and monitor stats with `/info`.\n" +
      "- Keep sleep schedule accurate with `/sleep schedule set/view`.\n" +
      "- Train regularly to build Battle Power for tougher adventures.\n" +
      "- Use `/park send|status|leave` to maintain social care.\n" +
      "- Set your preference with `/playdate settings`.\n" +
      "- Run `/playdate send` for direct 1-on-1 social interactions.\n" +
      "- Use `/adventure start`, `/adventure status`, and `/adventure claim`.\n" +
      "- Keep economy moving with `/daily`, `/quests view`, `/shop list`, and `/inventory`.\n" +
      "- Check `/leaderboard` regularly to follow community and season ranks.\n" +
      "- Notifications/reminders arrive via DMs (needs, adventure ready, events, social/gifts).\n" +
      "- Track active tasks in `/quests view`, `/adventure status`, `/events view`, `/cooldowns`.\n" +
      "- Milestones unlock over time, including titles in `/titles view`.\n" +
      "Use `/help` for full navigation and `/tutorial replay` anytime.\n" +
      "**Good luck out there in Dream Land ♡**",
  };
}

module.exports = {
  ONBOARDING_VERSION,
  REQUIRED_STEPS,
  OPTIONAL_STEPS,
  STEP_LABELS,
  getCompletionRecap,
  getCurrentPrompt,
  getStatus,
  recordEvent,
  registerAdoption,
  skipTutorial,
  startTutorial,
};
