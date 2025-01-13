// modules/systems/PathFollowingSystem.js
import { BehaviorTypes } from '../components/Behavior.js';

export class PathFollowingSystem {
  constructor() {
    // Define paths as arrays of points
    this.paths = {
      loop: [
        { x: 100, y: 100 },
        { x: 100, y: 500 },
        { x: 500, y: 500 },
        { x: 500, y: 100 },
      ],
      // Add more paths as needed
    };
  }

  update(world) {
    world.entities.forEach(entity => {
      const behavior = world.getComponent(entity, 'Behavior');
      const position = world.getComponent(entity, 'Position');
      const velocity = world.getComponent(entity, 'Velocity');

      if (behavior && behavior.type === BehaviorTypes.PATH_FOLLOW && position && velocity) {
        const path = this.paths[behavior.data.pathName];
        if (!path) return;

        let currentPointIndex = behavior.data.currentPoint || 0;
        const target = path[currentPointIndex];
        const dx = target.x - position.x;
        const dy = target.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
          // Move to next point
          currentPointIndex = (currentPointIndex + 1) % path.length;
          behavior.data.currentPoint = currentPointIndex;
          world.addComponent(entity, 'Behavior', behavior);
        } else {
          // Set velocity towards target
          velocity.vx = (dx / distance) * 1; // speed can be adjusted
          velocity.vy = (dy / distance) * 1;
          world.addComponent(entity, 'Velocity', velocity);
        }
      }
    });
  }
}
