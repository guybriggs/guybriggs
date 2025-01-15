// modules/systems/WorkerSpawner.js
import { createAgent } from '../factories/AgentFactory.js';
import { BehaviorTypes } from '../components/Behavior.js';
import { EmotionTypes } from '../components/Emotion.js';

/**
 * WorkerSpawner
 *  - Provides static methods to spawn a worker for grid or non-grid construction.
 */
export class WorkerSpawner {
  /**
   * Spawns a worker for a grid tile (wall/floor/door).
   * @param {World} world
   * @param {number} row
   * @param {number} col
   * @param {string} type - e.g., 'wall', 'floor', 'door'
   */
  static spawnGridWorker(world, row, col, type, tileSize) {
    const buildX = col * tileSize + tileSize / 2;
    const buildY = row * tileSize + tileSize / 2;

    // Random spawn 5-10 tiles away
    const spawnDist = tileSize * (5 + Math.random() * 5);
    const angle = Math.random() * TWO_PI;
    const spawnX = buildX + Math.cos(angle) * spawnDist;
    const spawnY = buildY + Math.sin(angle) * spawnDist;

    const worker = createAgent(world, {
      behavior: BehaviorTypes.WANDER,
      emotion: EmotionTypes.NEUTRAL
    });
    // Position
    const pos = world.getComponent(worker, 'Position');
    if (pos) {
      pos.x = spawnX;
      pos.y = spawnY;
    }
    // Renderable => helmet
    const renderable = world.getComponent(worker, 'Renderable');
    if (renderable) {
      renderable.helmet = true;
    }
    // Optional goal to walk to build site
    world.addComponent(worker, 'GoalPosition', { x: buildX, y: buildY });

    // ConstructionTask for grid
    world.addComponent(worker, 'ConstructionTask', {
      isGrid: true,
      type,
      row,
      col,
      startTime: millis(),
      constructing: false,
      returning: false,
      originX: spawnX,
      originY: spawnY
    });
    return worker;
  }

  /**
   * Spawns a worker for a non-grid item (table/bed).
   * @param {World} world
   * @param {number} x
   * @param {number} y
   * @param {string} type - e.g., 'table', 'bed'
   */
  static spawnNonGridWorker(world, x, y, type) {
    // Random spawn 5-10 tiles away from (x, y)
    const spawnDist = 32 * (5 + Math.random() * 5); // 32 is tileSize, or pass as param
    const angle = Math.random() * TWO_PI;
    const spawnX = x + Math.cos(angle) * spawnDist;
    const spawnY = y + Math.sin(angle) * spawnDist;

    const worker = createAgent(world, {
      behavior: BehaviorTypes.WANDER,
      emotion: EmotionTypes.NEUTRAL
    });
    // Position
    const pos = world.getComponent(worker, 'Position');
    if (pos) {
      pos.x = spawnX;
      pos.y = spawnY;
    }
    // Renderable => helmet
    const renderable = world.getComponent(worker, 'Renderable');
    if (renderable) {
      renderable.helmet = true;
    }
    // Optional goal to walk to build site
    world.addComponent(worker, 'GoalPosition', { x, y });

    // ConstructionTask for non-grid
    world.addComponent(worker, 'ConstructionTask', {
      isGrid: false,
      type,
      targetX: x,
      targetY: y,
      startTime: millis(),
      constructing: false,
      returning: false,
      originX: spawnX,
      originY: spawnY
    });
    return worker;
  }
}
