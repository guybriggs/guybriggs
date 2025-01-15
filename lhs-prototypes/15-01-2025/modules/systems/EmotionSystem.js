// modules/systems/EmotionSystem.js

import { EmotionTypes } from '../components/Emotion.js';
import { BehaviorTypes } from '../components/Behavior.js';

/**
 * EmotionSystem manages dynamic changes to agent emotions based on interactions or events.
 */
export class EmotionSystem {
  constructor() {
    // Define any initialization parameters if needed
  }

  update(world) {
    world.entities.forEach(entity => {
      const emotion = world.getComponent(entity, 'Emotion');
      const behavior = world.getComponent(entity, 'Behavior');

      if (!emotion) return;

      // Example Logic:
      // If an agent is wandering and encounters a group, they become happy
      if (behavior && behavior.type === BehaviorTypes.WANDER) {
        // Check proximity to other agents
        const pos = world.getComponent(entity, 'Position');
        if (!pos) return;

        const nearbyEntities = world.getEntitiesByComponents(['Position', 'Emotion'])
          .filter(otherEntity => otherEntity !== entity)
          .filter(otherEntity => {
            const otherPos = world.getComponent(otherEntity, 'Position');
            return dist(pos.x, pos.y, otherPos.x, otherPos.y) < 50; // Example proximity
          });

        if (nearbyEntities.length > 3) { // Example condition: near a group
          emotion.type = EmotionTypes.HAPPY;
          world.addComponent(entity, 'Emotion', emotion);
        } else {
          emotion.type = EmotionTypes.NEUTRAL;
          world.addComponent(entity, 'Emotion', emotion);
        }
      }

      // Additional emotion logic can be added here
    });
  }
}
