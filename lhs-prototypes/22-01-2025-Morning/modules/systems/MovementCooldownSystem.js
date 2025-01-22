// modules/systems/MovementCooldownSystem.js

import { MovementCooldownComponent } from '../components/MovementCooldown.js';

export class MovementCooldownSystem {
  constructor() {}

  update(world) {
    world.entities.forEach(entity => {
      const cooldown = world.getComponent(entity, 'MovementCooldown');
      if (cooldown) {
        // Decrement cooldown
        cooldown.remaining -= 1;
        if (cooldown.remaining <= 0) {
          // Cooldown over, remove components
          world.removeComponent(entity, 'MovementCooldown');
        } else {
          // Update cooldown component
          world.addComponent(entity, 'MovementCooldown', cooldown);
        }
      }
    });
  }
}
