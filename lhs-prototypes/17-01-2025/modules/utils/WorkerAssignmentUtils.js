// modules/utils/WorkerAssignmentUtils.js
import { Goods } from '../data/Goods.js';
import { tileSize } from '../tile/TileMap.js';

export function tryCommandeeringWorker(world, blockType, row, col) {
  const acceptablePrice = 10;
  const supplyAgents = world.getEntitiesByComponents(['Supply', 'Position']);
  let commandeeredWorker = null;

  // Find a supply agent with acceptable price and not currently on a construction task
  for (let agentId of supplyAgents) {
    const supply = world.getComponent(agentId, 'Supply');
    const constructionTask = world.getComponent(agentId, 'ConstructionTask');
    if (constructionTask) continue;
    if (supply && supply.reservationPrice <= acceptablePrice && supply.good === Goods.BRICK) {
      commandeeredWorker = agentId;
      break;
    }
  }

  if (commandeeredWorker) {
    console.log('Worker commandeered for block at', row, col);
    const pos = world.getComponent(commandeeredWorker, 'Position');
    const originX = pos ? pos.x : row * tileSize;
    const originY = pos ? pos.y : col * tileSize;
    const targetX = row * tileSize + tileSize / 2;
    const targetY = col * tileSize + tileSize / 2;

    world.addComponent(commandeeredWorker, 'ConstructionTask', {
      isGrid: true,
      type: blockType,
      row: row,
      col: col,
      startTime: millis(),
      constructing: false,
      returning: false,
      originX: originX,
      originY: originY
    });
    world.addComponent(commandeeredWorker, 'GoalPosition', { x: targetX, y: targetY });
    return commandeeredWorker;
  }
  return null;
}
