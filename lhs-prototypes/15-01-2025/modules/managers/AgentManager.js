// modules/managers/AgentManager.js

import { createAgent } from '../factories/AgentFactory.js';
import { BehaviorTypes } from '../components/Behavior.js';
import { EmotionTypes } from '../components/Emotion.js';
import { Goods, getRandomGood } from '../data/Goods.js';
import { RandomRange } from '../utils/RandomRange.js';

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
    //this.createWanderingAgents(10);
    //this.createGroupWanderingAgents(5, 1); // 5 agents in group 1
    //this.createPathFollowingAgents(3, 'loop'); // 3 agents following the 'loop' path
    //this.createSittingAgents(3); // 3 sitting agents alone
    //this.createGroupSittingAgents(4, 2); // 4 sitting agents in group 2
    //this.createEmotionalAgents(); // Additional emotional agents
    //this.createDemandAgents(5); // Create 5 agents with Demand component
    //this.createWorkerAgents(15); // Create 15 worker agents
    // Future: this.createSupplyAgents(count); // Method to create supply agents
    //console.log('All agents have been initialized.');

    this.createBlankAgents(10);
    this.createBrickWorkerAgents(3);
    this.createFishDemanderAgents(3);
    this.createBrickWorkerAgents(1, 45);
    this.createFishDemanderAgents(1, 2);

  }

  createFishDemanderAgents(count, price) {
    for (let i = 0; i < count; i++) {
      const good = Goods.FISH;
      const reservationPrice = price ? price : RandomRange(8, 15);
      const quantity = 999;

      const agent = createAgent(this.world, {
        behavior: BehaviorTypes.WANDER,
        emotion: EmotionTypes.HAPPY,
        demand: { good, reservationPrice, quantity }
      });
    }
  }

  createBlankAgents(count) {
    for (let i = 0; i < count; i++) {
      createAgent(this.world, {});
    }
  }

  createBrickWorkerAgents(count, price) {
    for (let i = 0; i < count; i++) {
      const good = Goods.BRICK;
      const reservationPrice = price ? price : RandomRange(3, 14);
      const quantity = 999;

      const agent = createAgent(this.world, {
        behavior: BehaviorTypes.WANDER,
        emotion: EmotionTypes.NEUTRAL,
        supply: { good, reservationPrice, quantity }
      });
      const renderable = this.world.getComponent(agent, 'Renderable');
      if(renderable) {
        renderable.helmet = true;
      }
    }
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

  /**
   * Creates agents with Demand component.
   * @param {number} count - Number of agents to create with Demand.
   */
  createDemandAgents(count) {
    for (let i = 0; i < count; i++) {
      const good = getRandomGood();
      const reservationPrice = 10;
      const quantity = 1;

      createAgent(this.world, {
        behavior: BehaviorTypes.WANDER,
        emotion: EmotionTypes.NEUTRAL,
        demand: { good, reservationPrice, quantity }
      });
    }
    //console.log(`${count} agents with Demand component created.`);
  }

 // Add this inside the AgentManager class in modules/managers/AgentManager.js

  /*createWorkerAgents(count) {
    for (let i = 0; i < count; i++) {
      const agent = createAgent(this.world, { 
      behavior: BehaviorTypes.WANDER, 
      emotion: EmotionTypes.NEUTRAL,
      worker: { expectedWage: 8 },
      });
      const renderable = this.world.getComponent(agent, 'Renderable');
      if(renderable) {
        renderable.helmet = true;
      }
  }
  //console.log(`${count} worker agents created.`);
  }*/

  // Future method for creating supply agents
  // createSupplyAgents(count) {
  //   for (let i = 0; i < count; i++) {
  //     const good = getRandomGood();
  //     const quantity = this.getRandomQuantityForGood(good);
  // 
  //     createAgent(this.world, {
  //       behavior: BehaviorTypes.PRODUCE, // Example behavior
  //       supply: { good, quantity }
  //     });
  //   }
  //   //console.log(`${count} agents with Supply component created.`);
  // }
}
