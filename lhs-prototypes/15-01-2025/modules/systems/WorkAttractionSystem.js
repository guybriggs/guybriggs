import { Goods } from '../data/Goods.js';
import { JobComponent } from '../components/Job.js';
import { SupplyComponent } from '../components/Supply.js';
import { DemandComponent } from '../components/Demand.js'; // if needed

export class WorkAttractionSystem {
  update(world, deltaTime) {
    const rods = world.getEntitiesByComponents(['FishingRod', 'Position']);
    // Get candidate agents without Demand, Supply, or Job
    const candidateAgents = world.getEntitiesByComponents(['Position', 'Velocity', 'Behavior', 'Inventory']);
    const blankAgents = candidateAgents.filter(id => 
      !world.hasComponent(id, 'Demand') &&
      !world.hasComponent(id, 'Supply') &&
      !world.hasComponent(id, 'Job')
    );

    rods.forEach(rodId => {
      const rodPos = world.getComponent(rodId, 'Position');
      const fishingRod = world.getComponent(rodId, 'FishingRod');
      if (!rodPos || !fishingRod) return;
      if (fishingRod.assigned) return;

      let nearestAgent = null;
      let minDist = Infinity;
      blankAgents.forEach(agentId => {
        const pos = world.getComponent(agentId, 'Position');
        const vel = world.getComponent(agentId, 'Velocity');
        if (!pos || !vel) return;
        const dx = rodPos.x - pos.x;
        const dy = rodPos.y - pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          minDist = dist;
          nearestAgent = { id: agentId, dx, dy, distance: dist, vel };
        }
      });

      if (nearestAgent) {
        const { id, dx, dy, distance, vel } = nearestAgent;
        if (distance < 5) {
          vel.vx = 0;
          vel.vy = 0;
          // On contact with the rod, assign Supply and Job if not already done
          if (!world.hasComponent(id, 'Supply')) {
            world.addComponent(id, 'Supply', SupplyComponent(Goods.FISH, fishingRod.wage, 0));
          }
          if (!world.hasComponent(id, 'Job')) {
            world.addComponent(id, 'Job', JobComponent('fishing', { rodId }));
          }
          fishingRod.assigned = true;
          // Optionally remove wandering behavior
          if (world.hasComponent(id, 'Behavior')) {
            world.removeComponent(id, 'Behavior');
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
