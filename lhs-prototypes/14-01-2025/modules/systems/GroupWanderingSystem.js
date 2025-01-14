// modules/systems/GroupWanderingSystem.js

import { BehaviorTypes } from '../components/Behavior.js';
import { MovementCooldownComponent } from '../components/MovementCooldown.js';

export class GroupWanderingSystem {
  constructor() {
    this.changeInterval = 120; // frames
  }

  update(world) {
    const groups = {};

    // Organize entities by group
    world.entities.forEach(entity => {
      const behavior = world.getComponent(entity, 'Behavior');
      const group = world.getComponent(entity, 'Group');

      if (behavior && behavior.type === BehaviorTypes.GROUP_WANDER && group) {
        if (!groups[group.groupId]) groups[group.groupId] = [];
        groups[group.groupId].push(entity);
      }
    });

    // Update each group
    for (const groupId in groups) {
      const groupEntities = groups[groupId];
      const leader = groupEntities[0];
      const leaderBehavior = world.getComponent(leader, 'Behavior');

      if (!leaderBehavior.lastChange || frameCount - leaderBehavior.lastChange > this.changeInterval) {
        // New random direction for the group
        const angle = Math.random() * TWO_PI;
        let speed = 1; // base speed

        // Check for speed modifier on leader
        const speedModifier = world.getComponent(leader, 'MovementSpeedModifier');
        if (speedModifier) {
          speed *= speedModifier.modifier;
        }

        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        groupEntities.forEach(entity => {
          const velocity = world.getComponent(entity, 'Velocity');
          if (velocity) {
            velocity.vx = vx;
            velocity.vy = vy;
            world.addComponent(entity, 'Velocity', velocity);
          }
        });

        leaderBehavior.lastChange = frameCount;
        world.addComponent(leader, 'Behavior', leaderBehavior);

        // Add MovementCooldown to all group members
        groupEntities.forEach(entity => {
          if (!world.hasComponent(entity, 'MovementCooldown') && !world.hasComponent(entity, 'Sitting')) {
            world.addComponent(entity, 'MovementCooldown', MovementCooldownComponent(120)); // 2 seconds
          }
        });
      }
    }
  }
}
