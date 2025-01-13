// modules/factories/AgentFactory.js

import { NameComponent } from '../components/Name.js';
import { GroupComponent } from '../components/Group.js';
import { BehaviorComponent, BehaviorTypes } from '../components/Behavior.js';
import { SittingComponent } from '../components/Sitting.js';
import { EmotionComponent, EmotionTypes } from '../components/Emotion.js';

const firstNames = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Ethan',
  'Fiona', 'George', 'Hannah', 'Ian', 'Julia',
  'Kevin', 'Laura', 'Mike', 'Nina', 'Oscar',
  'Paula', 'Quentin', 'Rachel', 'Steve', 'Tina',
  // Add more names as desired
];

function getRandomFirstName() {
  return firstNames[Math.floor(Math.random() * firstNames.length)];
}

/**
 * Creates an agent entity with specified behaviors and components.
 * @param {World} world - The ECS World instance.
 * @param {Object} options - Options to customize the agent.
 * @param {string} options.behavior - Behavior type of the agent.
 * @param {number} [options.groupId] - Group ID if the agent is part of a group.
 * @param {Object} [options.behaviorData] - Additional data for the behavior.
 * @param {number} [options.x] - Initial X position.
 * @param {number} [options.y] - Initial Y position.
 * @param {string} [options.emotion] - Emotion type of the agent.
 * @returns {Entity} The created agent entity.
 */
export function createAgent(world, options = {}) {
  const entity = world.createEntity();

  // Position Component
  world.addComponent(entity, 'Position', { 
    x: options.x !== undefined ? options.x : Math.random() * 2000, 
    y: options.y !== undefined ? options.y : Math.random() * 2000 
  });

  // Velocity Component
  world.addComponent(entity, 'Velocity', { vx: 0, vy: 0 });

  // Renderable Component
  world.addComponent(entity, 'Renderable', { radius: 8, color: 'white' });

  // Name Component
  world.addComponent(entity, 'Name', NameComponent(getRandomFirstName()));

  // Behavior Component
  const behaviorType = options.behavior || BehaviorTypes.WANDER;
  const behaviorData = options.behaviorData || {};
  world.addComponent(entity, 'Behavior', BehaviorComponent(behaviorType, behaviorData));

  // Emotion Component (Added Here)
  if (options.emotion !== undefined) {
    world.addComponent(entity, 'Emotion', EmotionComponent(options.emotion));
    //console.log(`Agent ${entity} added with Emotion component:`, options.emotion);
  }

  // Group Component (if applicable)
  if (options.groupId !== undefined) {
    world.addComponent(entity, 'Group', GroupComponent(options.groupId));
  }

  // Sitting Component (if behavior is 'sit')
  if (behaviorType === BehaviorTypes.SIT) {
    world.addComponent(entity, 'Sitting', SittingComponent());
  }

  return entity;
}
