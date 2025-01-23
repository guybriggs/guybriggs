import { tileMap, tileSize } from '../tile/TileMap.js';
import { exchangeMoney } from '../utils/ExchangeMoney.js';

export class ConstructionSystem {
  update(world) {
    const workers = world.getEntitiesByComponent('ConstructionTask');
    const now = millis();
    const speed = 5; // Adjust speed as needed

    for (let worker of workers) {
      const task = world.getComponent(worker, 'ConstructionTask');
      const pos = world.getComponent(worker, 'Position');
      if (!task || !pos) continue;

      if (!task.returning) {
        // Move worker to build site
        const { targetX, targetY } = this.getTargetCoords(task);
        const dx = targetX - pos.x;
        const dy = targetY - pos.y;
        const dist = sqrt(dx*dx + dy*dy);

        if (dist > 5) {
          pos.x += (dx/dist) * speed;
          pos.y += (dy/dist) * speed;
        } else {
          // At construction site
          if (!task.constructing) {
            task.constructing = true;
            task.startTime = now;
          } else if (now - task.startTime > 300) {
            // Construction finished for current project
            this.completeConstruction(world, worker, task, now);
          }
        }
      } else {
        // Returning logic with reduced speed
        const dx = task.originX - pos.x;
        const dy = task.originY - pos.y;
        const dist = sqrt(dx*dx + dy*dy);
        if (dist > 5) {
          pos.x += (dx/dist) * speed;
          pos.y += (dy/dist) * speed;
        } else {
          // Rather than deleting the worker, remove their ConstructionTask (and related components)
          world.removeComponent(worker, 'ConstructionTask');
          world.removeComponent(worker, 'GoalPosition');
          // Optionally, reset any other construction-specific flags or states on the worker
        }
      }

    }
  }

  completeConstruction(world, worker, task, now) {
    // Apply final changes to the constructed tile/building
    if (task.isGrid) {
      const tile = tileMap[task.row][task.col];
      if (tile && tile.transparent) tile.transparent = false;

      // GET paid!
      const moneyEntities = world.getEntitiesByComponent('Money');
      const playerMoney = world.getComponent(moneyEntities[0], 'Money');
      const workerSupply = world.getComponent(worker, 'Supply');
      const howMuchIWantToGetPaid = workerSupply.reservationPrice;

      exchangeMoney(world, moneyEntities[0], worker, howMuchIWantToGetPaid);

    } else {
      const bSys = this.findBuildingSystem(world);
      if (bSys && task.buildingIndex != null) {
        const bldg = bSys.nonGridBuildings[task.buildingIndex];
        if (bldg) {
          if (task.type === 'bed') bldg.color = '#6eb5ff';
          else if (task.type === 'table') bldg.color = '#d9a774';
          bldg.transparent = false;
        }
      }
    }

    // Remove the completed task from the placedBuildingsQueue
    const buildingSys = this.findBuildingSystem(world);
    if (buildingSys && buildingSys.placedBuildingsQueue) {
      buildingSys.placedBuildingsQueue = buildingSys.placedBuildingsQueue.filter(candidate => {
        // For grid tasks, compare row and col; extend logic for non-grid tasks if needed
        return !(candidate.row === task.row && candidate.col === task.col && candidate.type === task.type);
      });
    }

    // After finishing construction, try to assign a new task or mark worker for returning
    this.assignNewTaskOrReturn(world, worker, task, now);
  }

  assignNewTaskOrReturn(world, worker, task, now) {
    const buildingSys = this.findBuildingSystem(world);
    let newTaskData = null;
    if (buildingSys && buildingSys.placedBuildingsQueue) {
      for (const candidate of buildingSys.placedBuildingsQueue) {
        if (candidate.row != null && candidate.col != null) {
          const tile = tileMap[candidate.row][candidate.col];
          if (tile && tile.transparent) {
            newTaskData = candidate;
            break;
          }
        }
      }
    }

    if (newTaskData) {
      // Reassign current worker to the new task
      task.row = newTaskData.row;
      task.col = newTaskData.col;
      task.type = newTaskData.type;
      task.constructing = false;
      task.returning = false;
      task.startTime = now;
      if (task.isGrid) {
        const goalPos = world.getComponent(worker, 'GoalPosition');
        if (goalPos) {
          goalPos.x = task.col * tileSize + tileSize / 2;
          goalPos.y = task.row * tileSize + tileSize / 2;
        }
      }
      // For non-grid tasks, update targetX and targetY similarly if needed
    } else {
      // No new tasks found; worker should return
      task.returning = true;
      task.startTime = now;
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
    return world.buildingSystem || null;
  }
}
