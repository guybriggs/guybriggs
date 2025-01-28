// modules/factories/AgentFactory.js

import { NameComponent } from '../components/Name.js';
import { EmotionComponent, getRandomEmotion, getEmotionColor } from '../components/Emotion.js';
import { DemandComponent } from '../components/Demand.js';
import { SupplyComponent } from '../components/Supply.js';

import { getRandomGood } from '../data/Goods.js';
import { WorkerComponent } from '../components/Worker.js';
import { InventoryComponent } from '../components/Inventory.js';
import { MoneyComponent } from '../components/Money.js';
import { UtilityComponent } from '../components/Utility.js'; // <-- imported
import { RandomlyMoveComponent } from '../components/RandomlyMove.js';
import { WaitingComponent } from '../components/Waiting.js';

const firstNames = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Ethan',
  'Fiona', 'George', 'Hannah', 'Ian', 'Julia',
  'Kevin', 'Laura', 'Mike', 'Nina', 'Oscar',
  'Paula', 'Quentin', 'Rachel', 'Steve', 'Tina', 
  'Bob', 'Joe', 'Karl', 'Aiden','Sam', 'Tammy',
  'Leah', 'Denis', 'Dave', 'Peter', 'Marg', 'Sherlock',
  // Add more names as desired
];

function getRandomFirstName() {
  return firstNames[Math.floor(Math.random() * firstNames.length)];
}

export function createAgent(world, options = {}) {
  const entity = world.createEntity();

  // emotions
  const emotionType = getRandomEmotion();
  const emotionColor = getEmotionColor(emotionType);

  // Position Component
  const randomX = options.x !== undefined ? options.x : Math.random() * 2000;
  const randomY = options.y !== undefined ? options.y : Math.random() * 2000;
  world.addComponent(entity, 'Position', { 
    x: randomX, 
    y: randomY
  });
  
  // Also store as Origin
  world.addComponent(entity, 'Origin', { 
    x: randomX, 
    y: randomY
  });

  // Velocity
  world.addComponent(entity, 'Velocity', { vx: 0, vy: 0 });

  // Renderable
  world.addComponent(entity, 'Renderable', { radius: 8, color: 'white' });

  // Name
  world.addComponent(entity, 'Name', NameComponent(getRandomFirstName()));

  // Emotion
  world.addComponent(entity, 'Emotion', EmotionComponent( getRandomEmotion() ));

  // Group (if specified)
  if (options.groupId !== undefined) {
    // ... (if you have a GroupComponent, add it)
  }

  // Inventory
  world.addComponent(entity, 'Inventory', InventoryComponent());

  // Money
  world.addComponent(entity, 'Money', MoneyComponent(100));

  // Utility
  world.addComponent(entity, 'Utility', UtilityComponent(0));

  // Waiting
  world.addComponent(entity, 'Waiting', WaitingComponent());

  // Demand
  if (options.demand !== undefined) {
    const { good, reservationPrice, quantity } = options.demand;
    world.addComponent(entity, 'Demand', DemandComponent(good, reservationPrice, quantity));
  }

  // Supply
  if (options.supply !== undefined) {
    const { good, reservationPrice, quantity } = options.supply;
    world.addComponent(entity, 'Supply', SupplyComponent(good, reservationPrice, quantity));
  }

  // Worker
  if (options.worker !== undefined) {
    const { expectedWage } = options.worker;
    world.addComponent(entity, 'Worker', WorkerComponent(expectedWage));
  }

  return entity;
}
