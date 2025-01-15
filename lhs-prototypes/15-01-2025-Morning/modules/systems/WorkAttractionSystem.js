import { FishingRodComponent } from '../components/FishingRod.js';
import { WorkerComponent } from '../components/Worker.js';
import { JobComponent } from '../components/Job.js';

export class WorkAttractionSystem {
  update(world, deltaTime) {
    const rods = world.getEntitiesByComponents(['FishingRod', 'Position']);
    const workers = world.getEntitiesByComponents(['Worker', 'Position', 'Velocity']);

    rods.forEach(rodId => {
      const rodPos = world.getComponent(rodId, 'Position');
      const fishingRod = world.getComponent(rodId, 'FishingRod');
      if (!rodPos || !fishingRod) return;

      // Skip this rod if it's already assigned
      if (fishingRod.assigned) return;

      let nearestWorker = null;
      let minDist = Infinity;

      workers.forEach(workerId => {
        // Skip if worker already has a job assigned
        const existingJob = world.getComponent(workerId, 'Job');
        if (existingJob) {
          // Already employed, skip
          return;
        }

        const worker = world.getComponent(workerId, 'Worker');
        const workerPos = world.getComponent(workerId, 'Position');
        const workerVel = world.getComponent(workerId, 'Velocity');
        if (!worker || !workerPos || !workerVel) return;
        if (worker.expectedWage > fishingRod.wage) return;

        const dx = rodPos.x - workerPos.x;
        const dy = rodPos.y - workerPos.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          minDist = dist;
          nearestWorker = { id: workerId, dx, dy, distance: dist, vel: workerVel };
        }
      });

      if (nearestWorker) {
        const { dx, dy, distance, vel, id } = nearestWorker;
        if (distance < 5) {
          vel.vx = 0;
          vel.vy = 0;
          // Assign the fishing job and mark this rod as claimed

          if (!world.hasComponent(id, 'Job')) {
            world.addComponent(id, 'Job', JobComponent('fishing', { rodId }));
            fishingRod.assigned = true;
            world.removeComponent(id, 'Behavior'); 
            console.log(`Worker ${id} assigned to fishing job at rod ${rodId}.`);
          }
        } else {
          const speed = 1 / 10;
          vel.vx = (dx / distance) * speed * deltaTime;
          vel.vy = (dy / distance) * speed * deltaTime;
        }
      }
    });
  }
}
