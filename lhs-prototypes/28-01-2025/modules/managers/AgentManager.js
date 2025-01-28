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
    //this.createPathFollowingAgents(3, 'loop'); 
    //this.createSittingAgents(3); 
    //this.createGroupSittingAgents(4, 2);
    //this.createEmotionalAgents();
    //this.createDemandAgents(5);
    //this.createWorkerAgents(15);

    // Example usage of your specialized methods:
    this.createBlankAgents(10);          // <--- Will have Position + Origin + RandomlyMove
    this.createBrickWorkerAgents(5);     // Brick-supply workers
    this.createFishDemanderAgents(3);    // Fish-demanding agents

    //this.createBrickWorkerAgents(1, 45);
    //this.createFishDemanderAgents(1, 2);
    //this.createHighPriceWorkers(2);
    //this.createLightBlueNPCWorkers(4);

    // Also: spawn two fish-consumers
    this.spawnTwoFishConsumers();
    this.spawnTwoPotatoConsumers();
  }

  // (B) Define a helper method to create 2 potato consumers:
  spawnTwoPotatoConsumers() {
    const centralX = Math.random() * 1800 + 100;
    const centralY = Math.random() * 1800 + 100;

    for (let i = 0; i < 2; i++) {
      // Slight offset from center so they don't overlap exactly
      const x = centralX + RandomRange(-30, 30);
      const y = centralY + RandomRange(-30, 30);

      // demand => { good: 'potato', reservationPrice: random, quantity: 999 }
      const potatoDemand = createAgent(this.world, {
        emotion: EmotionTypes.NEUTRAL,
        x,
        y,
        demand: {
          good: Goods.POTATO, 
          reservationPrice: RandomRange(5, 12), 
          quantity: 999
        }
      });

      // Rename them for clarity
      const nameComp = this.world.getComponent(potatoDemand, 'Name');
      if (nameComp) {
        nameComp.firstName = `Potate ${i + 1}`;
      }
    }
  }

  /**
   * Spawns two fish-consumer agents positioned near each other.
   */
  spawnTwoFishConsumers() {
    // 1) Pick a central random location within [100..1900) to avoid edges
    const centralX = Math.random() * 1800 + 100;
    const centralY = Math.random() * 1800 + 100;

    for (let i = 0; i < 2; i++) {
      // 2) Create a fish-consumer agent with a slight offset
      const consumerX = centralX + RandomRange(-30, 30);
      const consumerY = centralY + RandomRange(-30, 30);

      const fishConsumer = createAgent(this.world, {
        emotion: EmotionTypes.NEUTRAL,
        x: consumerX,
        y: consumerY,
        demand: {
          good: Goods.FISH,
          reservationPrice: RandomRange(8, 15),
          quantity: 999
        }
      });

      // 3) Optionally rename them for clarity
      const nameComp = this.world.getComponent(fishConsumer, 'Name');
      if (nameComp) {
        nameComp.firstName = `Fishy ${i + 1}`;
      }
    }
  }

  createLightBlueNPCWorkers(count = 4) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 2000;
      const y = Math.random() * 2000;

      const entityId = createAgent(this.world, {
        worker: { expectedWage: 8 },
        supply: { good: 'brick', reservationPrice: 10, quantity: 999 },
        idle: true,
        x,
        y
      });

      const nameComp = this.world.getComponent(entityId, 'Name');
      if (nameComp) {
        nameComp.firstName = 'NPC';
      }
      const rend = this.world.getComponent(entityId, 'Renderable');
      if (rend) {
        rend.helmet = true;
        rend.helmetColor = '#DCDF2D'; 
        rend.color = '#609FEC';       
      }
    }
  }

  createFishDemanderAgents(count, price) {
    for (let i = 0; i < count; i++) {
      const good = Goods.FISH;
      const reservationPrice = price ? price : RandomRange(8, 20);
      const quantity = 999;

      createAgent(this.world, {
        emotion: EmotionTypes.HAPPY,
        demand: { good, reservationPrice, quantity }
      });
    }
  }

  /**
   * STEP 1: Create 'blank' agents, each with:
   *   - random (x, y)
   *   - Position & Origin => store initial spawn
   *   - RandomlyMove => so they wander
   */
  createBlankAgents(count) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 2000;
      const y = Math.random() * 2000;

      // 1) Create an agent with minimal overrides:
      const agentId = createAgent(this.world, { 
        // no special supply/demand/worker
      });

      // 2) Add a Position if createAgent doesn't do so
      this.world.addComponent(agentId, 'Position', { x, y });

      // 3) Store the same coordinates in an Origin component
      this.world.addComponent(agentId, 'Origin', { x, y });

      // (You can also rename them "Blank" if you wish, or pick a color, etc.)
    }
  }

  createBrickWorkerAgents(count, price) {
    for (let i = 0; i < count; i++) {
      const good = Goods.BRICK;
      const reservationPrice = price ? price : RandomRange(3, 9);
      const quantity = 999;

      const agent = createAgent(this.world, {
        emotion: EmotionTypes.NEUTRAL,
        supply: { good, reservationPrice, quantity },
        idle: true,
      });
      const renderable = this.world.getComponent(agent, 'Renderable');
      if (renderable) {
        renderable.helmet = true;
      }
    }
  }

  createPathFollowingAgents(count, pathName) {
    for (let i = 0; i < count; i++) {
      createAgent(this.world, { 
        emotion: EmotionTypes.WORRIED
      });
    }
  }

  createSittingAgents(count) {
    for (let i = 0; i < count; i++) {
      createAgent(this.world, { 
        emotion: EmotionTypes.RELAXED
      });
    }
  }

  createGroupSittingAgents(count, groupId) {
    for (let i = 0; i < count; i++) {
      createAgent(this.world, { 
        groupId,
        emotion: EmotionTypes.SAD
      });
    }
  }

  createEmotionalAgents() {
    // 2 angry
    for (let i = 0; i < 2; i++) {
      createAgent(this.world, { 
        emotion: EmotionTypes.ANGRY
      });
    }
    // 2 sad
    for (let i = 0; i < 2; i++) {
      createAgent(this.world, { 
        emotion: EmotionTypes.SAD
      });
    }
    // 2 happy
    for (let i = 0; i < 2; i++) {
      createAgent(this.world, { 
        emotion: EmotionTypes.HAPPY
      });
    }
  }

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
  }

  createHighPriceWorkers(count = 2) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 2000;
      const y = Math.random() * 2000;
      const pricey = 31 + Math.floor(Math.random() * 20);

      const entityId = createAgent(this.world, {
        worker: { expectedWage: 8 },
        supply: {
          good: 'brick',
          reservationPrice: pricey,
          quantity: 999
        },
        idle: true,
        x,
        y
      });
      const nameComp = this.world.getComponent(entityId, 'Name');
      if (nameComp) {
        nameComp.firstName = 'Pricey';
      }
      const rend = this.world.getComponent(entityId, 'Renderable');
      if (rend) {
        rend.helmet = true;
        rend.helmetColor = null;
        rend.color = '#E3E763';
      }
    }
  }
}
