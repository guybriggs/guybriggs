// modules/systems/ConstructionSystem.js
import { tileMap, tileSize } from '../tile/TileMap.js';

export class ConstructionSystem {
  update(world) {
    const workers = world.getEntitiesByComponent('ConstructionTask');
    const now = millis();

    for (let worker of workers) {
      const task = world.getComponent(worker, 'ConstructionTask');
      const pos = world.getComponent(worker, 'Position');
      if (!task || !pos) continue;

      if (!task.returning) {
        // Move worker to build site
        const { targetX, targetY } = this.getTargetCoords(task);
        const dx = targetX - pos.x, dy = targetY - pos.y;
        const dist = sqrt(dx*dx + dy*dy);

        if (dist > 5) {
          pos.x += dx/dist;
          pos.y += dy/dist;
        } else {
          // Start or continue constructing
          if (!task.constructing) {
            task.constructing = true;
            task.startTime = now;
          } else if (now - task.startTime > 5000) {
            // Construction done
            if (task.isGrid) {
              // For walls/floors/doors
              const tile = tileMap[task.row][task.col];
              if (tile && tile.transparent) tile.transparent = false;
            } else {
              // For bed/table
              const bSys = this.findBuildingSystem(world);
              if (bSys && task.buildingIndex != null) {
                const bldg = bSys.nonGridBuildings[task.buildingIndex];
                if (bldg) {
                  // Force color based on type
                  if (task.type === 'bed') bldg.color = '#6eb5ff';
                  else if (task.type === 'table') bldg.color = '#d9a774';

                  bldg.transparent = false;
                }
              }
            }
            task.returning = true;
            task.startTime = now;
          }
        }
      } else {
        // Return to origin
        const dx = task.originX - pos.x, dy = task.originY - pos.y;
        const dist = sqrt(dx*dx + dy*dy);
        if (dist > 5) {
          pos.x += dx/dist;
          pos.y += dy/dist;
        } else {
          // Remove worker
          world.entities.delete(worker);
          for (let [compName, compStore] of world.components) {
            compStore.delete(worker);
          }
        }
      }
    }
  }

  getTargetCoords(task) {
    if (task.isGrid) {
      return {
        targetX: task.col * tileSize + tileSize / 2,
        targetY: task.row * tileSize + tileSize / 2
      };
    }
    return { targetX: task.targetX, targetY: task.targetY };
  }

  findBuildingSystem(world) {
    // Adjust based on how you reference systems. For example:
    // return world.buildingSystem;
    return world.buildingSystem || null;
  }
}
