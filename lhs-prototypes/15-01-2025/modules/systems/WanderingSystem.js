// modules/systems/WanderingSystem.js

import { BehaviorTypes } from '../components/Behavior.js';
import { MovementCooldownComponent } from '../components/MovementCooldown.js';

export class WanderingSystem {
  constructor() {
    this.changeInterval = 60; // frames
    this.baseSpeed = 1; // base speed
  }

  update(world) {
    world.entities.forEach(entity => {
      const behavior = world.getComponent(entity, 'Behavior');
      const position = world.getComponent(entity, 'Position');
      const velocity = world.getComponent(entity, 'Velocity');

      if (behavior && behavior.type === BehaviorTypes.WANDER && position && velocity) {
        // Skip agents in cooldown or sitting
        if (world.hasComponent(entity, 'MovementCooldown') || world.hasComponent(entity, 'Sitting')) {
          return;
        }

        if (!behavior.lastChange || frameCount - behavior.lastChange > this.changeInterval) {
          // Random direction
          const angle = Math.random() * TWO_PI;
          let speed = this.baseSpeed;

          // Check for speed modifier
          const speedModifier = world.getComponent(entity, 'MovementSpeedModifier');
          if (speedModifier) {
            speed *= speedModifier.modifier;
          }

          velocity.vx = Math.cos(angle) * speed;
          velocity.vy = Math.sin(angle) * speed;
          behavior.lastChange = frameCount;
          world.addComponent(entity, 'Behavior', behavior);

          // After setting velocity, add MovementCooldown
          world.addComponent(entity, 'MovementCooldown', MovementCooldownComponent(120)); // 2 seconds
        }
      }
    });
  }
}
