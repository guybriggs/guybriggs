// modules/systems/FridgeSystem.js
import { DemandComponent } from '../components/Demand.js';
import { tileSize } from '../tile/TileMap.js';
import { RandomRange } from '../utils/RandomRange.js';
import { Goods } from '../data/Goods.js';

export class FridgeSystem {
  constructor(world, buildingSystem) {
    this.world = world;
    this.buildingSystem = buildingSystem;
  }

  update(deltaTime) {
    // Find agents that have a 'fridge' job
    const workers = this.world.getEntitiesByComponents(['Position', 'Velocity', 'Follower']);

    workers.forEach(workerId => {
      const job = this.world.getComponent(workerId, 'Job');
      if (!job || job.jobType !== 'fridge') {
        // Not a fridge job => skip
        return;
      }

      const pos = this.world.getComponent(workerId, 'Position');
      const vel = this.world.getComponent(workerId, 'Velocity');
      //const inventory = this.world.getComponent(workerId, 'Inventory');
      if (!pos || !vel) return;

      // 1) Find the nearest fridge building
      let nearestFridge = null;
      let minDist = Infinity;

      for (let b of this.buildingSystem.nonGridBuildings) {
        if (b.type === 'fridge') {
          // Compute distance from worker to this fridge
          const dx = b.x + b.w / 2 - pos.x;
          const dy = b.y + b.h / 2 - pos.y;
          const dist = Math.hypot(dx, dy);
          if (dist < minDist) {
            minDist = dist;
            nearestFridge = b;
          }
        }
      }

      // If there's no fridge at all, skip
      if (!nearestFridge) {
        // console.log(`Worker ${workerId}: no fridge found!`);
        return;
      }

      // 2) Move worker toward that fridge
      const dx = (nearestFridge.x + nearestFridge.w / 2) - pos.x;
      const dy = (nearestFridge.y + nearestFridge.h / 2) - pos.y;
      const dist = Math.hypot(dx, dy);

      // If > 1 unit away, keep walking
      if (dist > 1) {
        const speed = 1 / 10;
        vel.vx = (dx / dist) * speed * deltaTime;
        vel.vy = (dy / dist) * speed * deltaTime;
      } 
      // 3) If close enough, you can do "Phase 2" logic:
      else {
        // Stop moving
        vel.vx = 0;
        vel.vy = 0;

        if (!this.world.hasComponent(workerId, 'Demand')) {

          const good = Goods.FISH;
          const reservationPrice = RandomRange(8, 15);
          const quantity = 999;
          this.world.addComponent(workerId, 'Demand', DemandComponent(good, reservationPrice, quantity));
          this.world.removeComponent(workerId, 'Job');

          // **Also** modify the Follower so it no longer truly follows the player
          const followerComp = this.world.getComponent(workerId, 'Follower');
          if (followerComp) {
            // Option A: Set a huge followThreshold
            followerComp.skip = true;
            // Option B: Or remove the 'Follower' component entirely if you want them
            // to never follow again:
            // this.world.removeComponent(workerId, 'Follower');
          }

        }
      }
    });
  }
}
