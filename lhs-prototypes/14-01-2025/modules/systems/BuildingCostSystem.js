// modules/systems/BuildingCostSystem.js
import { tileMap, tileSize } from '../tile/TileMap.js';

/**
 * BuildingCostSystem
 *  - Observes building placements.
 *  - Deducts $10 from the player's Money component
 *    whenever a building is placed (wall, floor, door, table, bed).
 */
export class BuildingCostSystem {
  constructor() {
    // No local state needed
  }

  /**
   * Called each frame or after building actions, depending on your approach.
   * If you dispatch an event or store a “just placed” record,
   * you can deduct money here.
   */
  update(world) {
    // Example approach: let BuildingSystem mark new placements in a queue,
    // then we process them here.
    const placedBuildings = world.placedBuildingsQueue || [];
    if (placedBuildings.length === 0) return;

    // We assume the player is entity #1 or we look it up
    // (Alternatively, store a "playerEntity" globally and reference it.)
    const playerEntity = this.getPlayerEntity(world);
    if (!playerEntity) return;

    const moneyComp = world.getComponent(playerEntity, 'Money');
    if (!moneyComp) return;

    // Deduct $10 for each building placed
    for (let building of placedBuildings) {
      // building might look like: { type: 'wall'/'floor'/'bed', row, col, x, y, etc. }
      if (this.isCostableType(building.type)) {
        moneyComp.amount -= 10;
      }
    }

    // Clear out the queue so we don't deduct again
    world.placedBuildingsQueue = [];
  }

  isCostableType(type) {
    // Charge for these
    const costable = ['wall', 'floor', 'door', 'table', 'bed'];
    return costable.includes(type);
  }

  getPlayerEntity(world) {
    // This example just looks for an entity with a 'Money' component
    const moneyEntities = world.getEntitiesWith('Money');
    return moneyEntities.length > 0 ? moneyEntities[0] : null;
  }
}
