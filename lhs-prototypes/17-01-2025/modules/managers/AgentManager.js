// modules/managers/AgentManager.js

import { createAgent } from '../factories/AgentFactory.js';
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

  initializeAgents() {
    //this.createPathFollowingAgents(3, 'loop'); // 3 agents following the 'loop' path
    //this.createSittingAgents(3); // 3 sitting agents alone
    //this.createGroupSittingAgents(4, 2); // 4 sitting agents in group 2
    //this.createEmotionalAgents(); // Additional emotional agents
    //this.createDemandAgents(5); // Create 5 agents with Demand component
    //this.createWorkerAgents(15); // Create 15 worker agents
    // Future: this.createSupplyAgents(count); // Method to create supply agents
    //console.log('All agents have been initialized.');

    this.createBlankAgents(10);
    //this.createBrickWorkerAgents(5);
    this.createFishDemanderAgents(3);
    this.createBrickWorkerAgents(1, 45);
    this.createFishDemanderAgents(1, 2);
    this.createHighPriceWorkers(2);
    this.createLightBlueNPCWorkers(4);

  }

  createLightBlueNPCWorkers(count = 4) {
    for (let i = 0; i < count; i++) {
      // Random coords in [0..2000)
      const x = Math.random() * 2000;
      const y = Math.random() * 2000;
  
      // Spawn with worker + supply + visual overrides
      const entityId = createAgent(this.world, {
        // typical worker wage
        worker: { expectedWage: 8 },
  
        // Like the red-helmet worker eventually becomes: supply bricks
        supply: { good: 'brick', reservationPrice: 10, quantity: 999 },
        idle: true,  // so they don't wander if you prefer
        x,
        y
      });
  
      // Name => NPC
      const nameComp = this.world.getComponent(entityId, 'Name');
      if (nameComp) {
        nameComp.firstName = 'NPC';
      }
  
      // Render => helmet = true, helmetColor & body color => light blue
      const rend = this.world.getComponent(entityId, 'Renderable');
      if (rend) {
        rend.helmet = true;
        rend.helmetColor = '#DCDF2D'; 
        rend.color = '#609FEC';       // light blue body circle
      }
    }
  }

  createFishDemanderAgents(count, price) {
    for (let i = 0; i < count; i++) {
      const good = Goods.FISH;
      const reservationPrice = price ? price : RandomRange(8, 15);
      const quantity = 999;

      const agent = createAgent(this.world, {
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
        emotion: EmotionTypes.NEUTRAL,
        supply: { good, reservationPrice, quantity },
        idle: true,
      });
      const renderable = this.world.getComponent(agent, 'Renderable');
      if(renderable) {
        renderable.helmet = true;
      }
    }
  }

  /**
   * Creates a specified number of agents that follow a predefined path.
   * @param {number} count - Number of path-following agents to create.
   * @param {string} pathName - Name of the path to follow.
   */
  createPathFollowingAgents(count, pathName) {
    for (let i = 0; i < count; i++) {
      createAgent(this.world, { 
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
        emotion: EmotionTypes.ANGRY
      });
    }

    // Example: 2 sad agents
    for (let i = 0; i < 2; i++) {
      createAgent(this.world, { 
        emotion: EmotionTypes.SAD
      });
    }

    // Example: 2 happy agents
    for (let i = 0; i < 2; i++) {
      createAgent(this.world, { 
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
        emotion: EmotionTypes.NEUTRAL,
        demand: { good, reservationPrice, quantity }
      });
    }
    //console.log(`${count} agents with Demand component created.`);
  }

  createHighPriceWorkers(count = 2) {
    for (let i = 0; i < count; i++) {
      // 1) Random spawn anywhere in [0..2000)
      const x = Math.random() * 2000;
      const y = Math.random() * 2000;
      
      // 2) A big reservationPrice, say 31..50
      const pricey = 31 + Math.floor(Math.random() * 20);
  
      // 3) createAgent => worker + supply (brick)
      const entityId = createAgent(this.world, {
        worker: { expectedWage: 8 },
        supply: {
          good: 'brick',
          reservationPrice: pricey, // Over $30
          quantity: 999
        },
        idle: true,  // so they don't wander if you prefer
        x,
        y
      });
  
      // 4) Optionally rename them "Pricey Worker" or similar
      const nameComp = this.world.getComponent(entityId, 'Name');
      if (nameComp) {
        nameComp.firstName = 'Pricey'; 
      }
  
      // 5) If you want them to look like normal building workers:
      const rend = this.world.getComponent(entityId, 'Renderable');
      if (rend) {
        rend.helmet = true;
        rend.helmetColor = null;   // or pick a color
        rend.color = '#E3E763';    // same body color as your “converted” worker
        // rend.faceColor = '#...'; // optionally define a faceColor
      }
    }
  }
}


