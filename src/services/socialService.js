const playerRepository = require("../repositories/playerRepository");
const progressionService = require("./progressionService");
const globalEventService = require("./globalEventService");

function clampStat(value) {
  return Math.min(100, Math.max(0, value));
}

function getOneWayMultiplier(countToday) {
  if (countToday <= 1) return 1;
  if (countToday === 2) return 0.7;
  if (countToday === 3) return 0.45;
  if (countToday === 4) return 0.2;
  return 0;
}

function getRemainingCooldownMs(lastAt, cooldownMinutes, now = new Date()) {
  if (!lastAt) {
    return 0;
  }

  const elapsed = now.getTime() - new Date(lastAt).getTime();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  return elapsed >= cooldownMs ? 0 : cooldownMs - elapsed;
}

async function setSocialOptIn(userId, enabled) {
  const player = await playerRepository.findByUserId(userId);
  if (!player) {
    return {
      ok: false,
      reason: "missing-player",
    };
  }

  player.socialOptIn = Boolean(enabled);
  await playerRepository.savePlayer(player);
  return {
    ok: true,
    enabled: player.socialOptIn,
  };
}

async function oneWayPlayWithUser(userId, targetUserId, now = new Date()) {
  if (userId === targetUserId) {
    return {
      ok: false,
      reason: "self-target",
    };
  }

  const [sender, target] = await Promise.all([
    playerRepository.findByUserId(userId),
    playerRepository.findByUserId(targetUserId),
  ]);

  if (!sender) {
    return {
      ok: false,
      reason: "missing-player",
    };
  }

  if (!target) {
    return {
      ok: false,
      reason: "missing-target",
    };
  }

  const waitMs = getRemainingCooldownMs(sender.lastCare?.socialPlay, 20, now);
  if (waitMs > 0) {
    return {
      ok: false,
      reason: "cooldown",
      waitMs,
    };
  }

  const socialMemory = await progressionService.registerOneWaySocialTarget(
    userId,
    targetUserId,
    now
  );
  const countToday = socialMemory.countToday;
  const multiplier = getOneWayMultiplier(countToday);
  if (multiplier <= 0) {
    return {
      ok: false,
      reason: "diminishing-returns",
      countToday,
    };
  }

  const socialGain = Math.max(1, Math.round(12 * multiplier));
  const affectionGain = Math.max(1, Math.round(6 * multiplier));
  sender.social = clampStat((sender.social || 0) + socialGain);
  sender.affection = clampStat((sender.affection || 0) + affectionGain);
  sender.lastCare = sender.lastCare || {};
  sender.lastCare.socialPlay = now;

  await Promise.all([
    playerRepository.savePlayer(sender),
    progressionService.recordSocialAction(userId, 1, now),
    globalEventService.recordContribution(userId, 1, now),
  ]);

  return {
    ok: true,
    oneWay: true,
    targetKirbyName: target.kirbyName,
    socialGain,
    affectionGain,
    countToday,
  };
}

async function interactWithPlayerKiby(userId, targetUserId, action = "cheer", now = new Date()) {
  if (userId === targetUserId) {
    return {
      ok: false,
      reason: "self-target",
    };
  }

  const [sender, target] = await Promise.all([
    playerRepository.findByUserId(userId),
    playerRepository.findByUserId(targetUserId),
  ]);

  if (!sender) {
    return {
      ok: false,
      reason: "missing-player",
    };
  }

  if (!target) {
    return {
      ok: false,
      reason: "missing-target",
    };
  }

  if (!target.socialOptIn) {
    return {
      ok: false,
      reason: "target-opted-out",
      target,
    };
  }

  const waitMs = getRemainingCooldownMs(sender.lastCare?.socialPlay, 30, now);
  if (waitMs > 0) {
    return {
      ok: false,
      reason: "cooldown",
      waitMs,
    };
  }

  const actionEffects = {
    cheer: {
      senderSocial: 6,
      targetAffection: 4,
      targetSocial: 3,
    },
    encourage: {
      senderSocial: 5,
      targetAffection: 2,
      targetSocial: 5,
    },
    wave: {
      senderSocial: 4,
      targetAffection: 3,
      targetSocial: 2,
    },
  };

  const selected = actionEffects[action] || actionEffects.cheer;
  sender.social = clampStat((sender.social || 0) + selected.senderSocial);
  sender.lastCare = sender.lastCare || {};
  sender.lastCare.socialPlay = now;

  target.affection = clampStat((target.affection || 0) + selected.targetAffection);
  target.social = clampStat((target.social || 0) + selected.targetSocial);

  await Promise.all([
    playerRepository.savePlayer(sender),
    playerRepository.savePlayer(target),
    progressionService.recordSocialAction(userId, 1, now),
    globalEventService.recordContribution(userId, 1, now),
  ]);

  return {
    ok: true,
    oneWay: false,
    action,
    senderGain: selected.senderSocial,
    targetAffectionGain: selected.targetAffection,
    targetSocialGain: selected.targetSocial,
    targetKirbyName: target.kirbyName,
  };
}

module.exports = {
  interactWithPlayerKiby,
  oneWayPlayWithUser,
  setSocialOptIn,
};
