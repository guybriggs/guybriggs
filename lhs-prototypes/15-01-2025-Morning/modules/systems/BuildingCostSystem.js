// modules/systems/BuildingCostSystem.js
import { tileMap, tileSize } from '../tile/TileMap.js';

/**
 * BuildingCostSystem
 *  - Observes building placements (new or rebuild).
 *  - Deducts $10 from the player's Money component
 *    whenever a building is placed or rebuilt.
 */
export class BuildingCostSystem {
  constructor() {}

  update(world) {
    const placedBuildings = world.placedBuildingsQueue || [];
    if (placedBuildings.length === 0) return;

    const playerEntity = this.getPlayerEntity(world);
    if (!playerEntity) return;

    const moneyComp = world.getComponent(playerEntity, 'Money');
    if (!moneyComp) return;

    // Deduct $10 for each building placed or rebuilt
    for (let building of placedBuildings) {
      if (building.rebuild === true) {
        // Rebuild scenario => -$10
        moneyComp.amount -= 10;
      } 
      else if (this.isCostableType(building.type)) {
        // Normal build scenario => -$10 if type is costable
        moneyComp.amount -= 10;
      }
    }

    // Clear out the queue so we don't deduct again
    world.placedBuildingsQueue = [];
  }

  isCostableType(type) {
    // Charge for these initial builds
    const costable = ['wall', 'floor', 'door', 'table', 'bed'];
    return costable.includes(type);
  }

  getPlayerEntity(world) {
    // Looks for any entity with a 'Money' component
    const moneyEntities = world.getEntitiesWith('Money');
    return moneyEntities.length > 0 ? moneyEntities[0] : null;
  }
}