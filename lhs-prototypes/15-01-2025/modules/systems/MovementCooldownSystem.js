// modules/systems/MovementCooldownSystem.js

import { MovementCooldownComponent } from '../components/MovementCooldown.js';
import { MovementSpeedModifierComponent } from '../components/MovementSpeedModifier.js';

export class MovementCooldownSystem {
  constructor() {}

  update(world) {
    world.entities.forEach(entity => {
      const cooldown = world.getComponent(entity, 'MovementCooldown');
      if (cooldown) {
        // Apply speed modifier if not already applied
        const speedModifier = world.getComponent(entity, 'MovementSpeedModifier');
        if (!speedModifier) {
          world.addComponent(entity, 'MovementSpeedModifier', MovementSpeedModifierComponent(0.5)); // Slow down by half
        }

        // Decrement cooldown
        cooldown.remaining -= 1;
        if (cooldown.remaining <= 0) {
          // Cooldown over, remove components
          world.removeComponent(entity, 'MovementCooldown');
          world.removeComponent(entity, 'MovementSpeedModifier');
        } else {
          // Update cooldown component
          world.addComponent(entity, 'MovementCooldown', cooldown);
        }
      }
    });
  }
}
