// modules/managers/AgentManager.js

import { createAgent } from '../factories/AgentFactory.js';
import { BehaviorTypes } from '../components/Behavior.js';
import { EmotionTypes } from '../components/Emotion.js';

/**
 * AgentManager is responsible for initializing and managing agents within the world.
 */
export class AgentManager {
  /**
   * @param {World} world - The ECS World instance.
   */
  constructor(world) {
    this.world = world;
  }

  /**
   * Initializes agents with different behaviors and emotions.
   */
  initializeAgents() {
    this.createWanderingAgents(10);
    this.createGroupWanderingAgents(5, 1); // 5 agents in group 1
    this.createPathFollowingAgents(3, 'loop'); // 3 agents following the 'loop' path
    this.createSittingAgents(3); // 3 sitting agents alone
    this.createGroupSittingAgents(4, 2); // 4 sitting agents in group 2
    this.createEmotionalAgents(); // Additional emotional agents
    //console.log('All agents have been initialized.');
  }

  /**
   * Creates a specified number of agents that wander aimlessly.
   * @param {number} count - Number of wandering agents to create.
   */
  createWanderingAgents(count) {
    for (let i = 0; i < count; i++) {
      createAgent(this.world, { 
        behavior: BehaviorTypes.WANDER,
        emotion: EmotionTypes.HAPPY // Assigning happy emotion
      });
    }
    //console.log(`${count} wandering agents created.`);
  }

  /**
   * Creates a specified number of agents that wander in a group.
   * @param {number} count - Number of group-wandering agents to create.
   * @param {number} groupId - Identifier for the group.
   */
  createGroupWanderingAgents(count, groupId) {
    for (let i = 0; i < count; i++) {
      createAgent(this.world, { 
        behavior: BehaviorTypes.GROUP_WANDER, 
        groupId,
        emotion: EmotionTypes.NEUTRAL // Assigning neutral emotion
      });
    }
    //console.log(`${count} group-wandering agents created in group ${groupId}.`);
  }

  /**
   * Creates a specified number of agents that follow a predefined path.
   * @param {number} count - Number of path-following agents to create.
   * @param {string} pathName - Name of the path to follow.
   */
  createPathFollowingAgents(count, pathName) {
    for (let i = 0; i < count; i++) {
      createAgent(this.world, { 
        behavior: BehaviorTypes.PATH_FOLLOW, 
        behaviorData: { pathName },
        emotion: EmotionTypes.WORRIED // Assigning worried emotion
      });
    }
    //console.log(`${count} path-following agents created following path '${pathName}'.`);
  }

  /**
   * Creates a specified number of agents that sit alone.
   * @param {number} count - Number of sitting agents to create.
   */
  createSittingAgents(count) {
    for (let i = 0; i < count; i++) {
      createAgent(this.world, { 
        behavior: BehaviorTypes.SIT,
        emotion: EmotionTypes.RELAXED // Assigning relaxed emotion
      });
    }
    //console.log(`${count} sitting agents created alone.`);
  }

  /**
   * Creates a specified number of agents that sit in a group.
   * @param {number} count - Number of group-sitting agents to create.
   * @param {number} groupId - Identifier for the group.
   */
  createGroupSittingAgents(count, groupId) {
    for (let i = 0; i < count; i++) {
      createAgent(this.world, { 
        behavior: BehaviorTypes.SIT, 
        groupId,
        emotion: EmotionTypes.SAD // Assigning sad emotion
      });
    }
    //console.log(`${count} group-sitting agents created in group ${groupId}.`);
  }

  /**
   * Creates agents with various emotions.
   */
  createEmotionalAgents() {
    // Example: 2 angry agents
    for (let i = 0; i < 2; i++) {
      createAgent(this.world, { 
        behavior: BehaviorTypes.WANDER,
        emotion: EmotionTypes.ANGRY
      });
    }

    // Example: 2 sad agents
    for (let i = 0; i < 2; i++) {
      createAgent(this.world, { 
        behavior: BehaviorTypes.WANDER,
        emotion: EmotionTypes.SAD
      });
    }

    // Example: 2 happy agents
    for (let i = 0; i < 2; i++) {
      createAgent(this.world, { 
        behavior: BehaviorTypes.WANDER,
        emotion: EmotionTypes.HAPPY
      });
    }

    //console.log(`Emotional agents (Angry, Sad, Happy) created.`);
  }
}