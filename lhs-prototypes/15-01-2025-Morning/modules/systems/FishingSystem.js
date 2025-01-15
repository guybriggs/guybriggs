import { tileMap, tileSize } from '../tile/TileMap.js';
import { InventoryComponent } from '../components/Inventory.js';

export class FishingSystem {
  constructor(world, buildingSystem) {
    this.world = world;
    this.buildingSystem = buildingSystem;
  }

  update(deltaTime) {
    // Only process workers who have a Job component (specifically fishing jobs)
    const workers = this.world.getEntitiesByComponents(['Worker', 'Position', 'Velocity', 'Inventory', 'Job']);

    workers.forEach(workerId => {
      const job = this.world.getComponent(workerId, 'Job');
      // Process only fishing jobs
      if (!job || job.jobType !== 'fishing') {
        console.log(`Worker ${workerId} does not have a fishing job. Skipping.`);
        return;
      }
      const pos = this.world.getComponent(workerId, 'Position');
      const vel = this.world.getComponent(workerId, 'Velocity');
      const inventory = this.world.getComponent(workerId, 'Inventory');
      if (!pos || !vel || !inventory) return;

      // Retrieve the associated fishing rod
      const rodId = job.rodId;
      if (!rodId) {
        console.error(`No rodId found in job for worker ${workerId}.`);
        return;
      }
      
      const rodPos = this.world.getComponent(rodId, 'Position');

      // Phase 1: If worker isn't carrying fish, head from rod to ocean
      if (!inventory.items.fish) {
        // Directly find the nearest ocean tile without referencing buildingSystem
        if (!inventory.targetOcean) {
          const oceanTile = this.findNearestTile(pos, 'ocean');
          if (oceanTile) {
            inventory.targetOcean = {
              x: oceanTile.col * tileSize + tileSize / 2,
              y: oceanTile.row * tileSize + tileSize / 2
            };
          }
        }
      
        // Move toward the target ocean location if set
        if (inventory.targetOcean) {
          const ddx = inventory.targetOcean.x - pos.x;
          const ddy = inventory.targetOcean.y - pos.y;
          const d = Math.hypot(ddx, ddy);
            // ...
            // Inside Phase 1: When moving toward the target ocean location
            if (d > 1) {
                const speed = 1/10;
                vel.vx = (ddx / d) * speed * deltaTime;
                vel.vy = (ddy / d) * speed * deltaTime;
            } else {
                // Arrived at ocean: start fishing process if not already started
                if (!inventory.fishingStartTime) {
                inventory.fishingStartTime = millis(); // record start time
                }
            
                // Check if 5 seconds have passed since starting fishing
                if (millis() - inventory.fishingStartTime >= 5000) {
                // 5 seconds elapsed: complete fishing
                this.addItemToInventory(workerId, 'fish', 1);
                vel.vx = 0;
                vel.vy = 0;
                console.log(`Worker ${workerId} fished 1 fish.`);
                delete inventory.fishingStartTime;
                delete inventory.targetOcean;
                } else {
                vel.vx = 0;
                vel.vy = 0;
                }
            }
        }
      }      
      // Phase 2: Worker carrying fish; go deposit it
      else {
        // Instead of finding the crate nearest to the worker,
        // find the crate nearest to the assigned fishing rod.
        let nearestCrate = null;
        let minDist = Infinity;
        for (let b of this.buildingSystem.nonGridBuildings) {
          if (b.type === 'crate') {
            const dx = rodPos.x - (b.x + b.w / 2);
            const dy = rodPos.y - (b.y + b.h / 2);
            const d = Math.hypot(dx, dy);
            if (d < minDist) {
              minDist = d;
              nearestCrate = b;
            }
          }
        }

        if (nearestCrate) {
          const dx = (nearestCrate.x + nearestCrate.w / 2) - pos.x;
          const dy = (nearestCrate.y + nearestCrate.h / 2) - pos.y;
          const d = Math.hypot(dx, dy);
          if (d > 1) {
            const speed = 1/10;
            vel.vx = (dx / d) * speed * deltaTime;
            vel.vy = (dy / d) * speed * deltaTime;
          } else {
            // At crate: deposit fish
            this.removeItemFromInventory(workerId, 'fish', 1);
            vel.vx = 0;
            vel.vy = 0;
            console.log(`Worker ${workerId} deposited fish in crate.`);
            // Optionally: reset rod assignment here if you want cycles of work
            const fishingRod = this.world.getComponent(rodId, 'FishingRod');
            if (fishingRod) {
              //fishingRod.assigned = false; 
            }
            // Clear job if needed to allow new assignments
            // world.removeComponent(workerId, 'Job');
          }
        } else {
          console.log(`Worker ${workerId} drops fish on floor at (${pos.x}, ${pos.y}).`);
          this.removeItemFromInventory(workerId, 'fish', 1);
          vel.vx = 0;
          vel.vy = 0;
        }
      }
    });
  }

  addItemToInventory(workerId, item, amount) {
    const inventory = this.world.getComponent(workerId, 'Inventory');
    if (inventory.items[item]) {
      inventory.items[item] += amount;
    } else {
      inventory.items[item] = amount;
    }
  }

  removeItemFromInventory(workerId, item, amount) {
    const inventory = this.world.getComponent(workerId, 'Inventory');
    if (inventory.items[item]) {
      inventory.items[item] -= amount;
      if (inventory.items[item] <= 0) {
        delete inventory.items[item];
      }
    }
  }

  findNearestTile(pos, type) {
    let nearest = null;
    let minDist = Infinity;
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        if (tileMap[r][c].type === type) {
          const tileX = c * tileSize + tileSize / 2;
          const tileY = r * tileSize + tileSize / 2;
          const d = Math.hypot(pos.x - tileX, pos.y - tileY);
          if (d < minDist) {
            minDist = d;
            nearest = { row: r, col: c };
          }
        }
      }
    }
    return nearest;
  }
}
