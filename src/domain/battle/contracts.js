/**
 * Battle system scaffolding for future optional PvP/PvE.
 */

function buildBattleProfile(entity) {
  return {
    entityType: entity.type,
    entityId: entity.userId || entity.npcId,
    kirbyName: entity.kirbyName,
    level: entity.level,
    hp: entity.hp,
    hunger: entity.hunger,
    affection: entity.affection,
    social: entity.social || 0,
    battlePower: entity.battlePower || 0,
    battleRating: entity.level * 100 + entity.xp + (entity.battlePower || 0) * 2,
  };
}

module.exports = {
  buildBattleProfile,
};
