// modules/systems/WanderingSystem.js

import { MovementCooldownComponent } from '../components/MovementCooldown.js';
import { RandomlyMoveComponent } from '../components/RandomlyMove.js';

export class RandomlyMoveSystem {
  constructor() {
    this.changeInterval = 60; // frames
    this.baseSpeed = 1; // base speed
  }

  update(world) {
    world.entities.forEach(entity => {
      const randomlyMove = world.getComponent(entity, 'RandomlyMove');
      const position = world.getComponent(entity, 'Position');
      const velocity = world.getComponent(entity, 'Velocity');

      if (randomlyMove && position && velocity) {
        // Skip agents in cooldown or sitting
        if (world.hasComponent(entity, 'MovementCooldown')) {
          return;
        }

        if (!randomlyMove.lastChange || frameCount - randomlyMove.lastChange > this.changeInterval) {
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
          randomlyMove.lastChange = frameCount;
          world.addComponent(entity, 'RandomlyMove', randomlyMove);

          // After setting velocity, add MovementCooldown
          world.addComponent(entity, 'MovementCooldown', MovementCooldownComponent(120)); // 2 seconds
        }
      }
    });
  }
}
