// modules/systems/GoalMovementSystem.js
// Under 40 lines

export class GoalMovementSystem {
    constructor(speed = 1, stopThreshold = 5) {
      // Adjust speed or threshold as needed
      this.speed = speed;
      this.stopThreshold = stopThreshold;
    }
  
    update(world, dt) {
      // Gather entities that have: GoalPosition, Position, Velocity
      const entities = world.getEntitiesByComponents([
        'GoalPosition',
        'Position',
        'Velocity'
      ]);
  
      for (const eId of entities) {
        const goalPos = world.getComponent(eId, 'GoalPosition');
        const pos = world.getComponent(eId, 'Position');
        const vel = world.getComponent(eId, 'Velocity');
        if (!goalPos || !pos || !vel) continue;
  
        // Distance to goal
        const dx = goalPos.x - pos.x;
        const dy = goalPos.y - pos.y;
        const dist = Math.hypot(dx, dy);
  
        // If we're outside the stop threshold => move closer
        if (dist > this.stopThreshold) {
          // Optionally scale by dt for frame-rate independence
          const step = this.speed * (dt / 16.7); 
          // Or just use this.speed directly if you prefer
          vel.vx = (dx / dist) * step;
          vel.vy = (dy / dist) * step;
        } else {
          // Close enough => stop
          vel.vx = 0;
          vel.vy = 0;
        }
      }
    }
  }
  