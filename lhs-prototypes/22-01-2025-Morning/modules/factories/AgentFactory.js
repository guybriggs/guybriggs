// modules/factories/AgentFactory.js

import { NameComponent } from '../components/Name.js';
import { EmotionComponent, getRandomEmotion, getEmotionColor } from '../components/Emotion.js';
import { DemandComponent } from '../components/Demand.js'; // Updated import
import { SupplyComponent } from '../components/Supply.js'; // New import

import { getRandomGood } from '../data/Goods.js'; // Import utility function if needed
import { WorkerComponent } from '../components/Worker.js';
import { InventoryComponent } from '../components/Inventory.js';
import { MoneyComponent } from '../components/Money.js';
import { RandomlyMoveComponent } from '../components/RandomlyMove.js';
import { WaitingComponent } from '../components/Waiting.js';

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
  
  world.addComponent(entity, 'Origin', { 
    x: randomX, 
    y: randomY
  });

  // Velocity Component
  world.addComponent(entity, 'Velocity', { vx: 0, vy: 0 });

  // Renderable Component
  world.addComponent(entity, 'Renderable', { radius: 8, color: 'white' });

  // Name Component
  world.addComponent(entity, 'Name', NameComponent(getRandomFirstName()));

  // Emotion Component
  world.addComponent(entity, 'Emotion', EmotionComponent( getRandomEmotion() ));

  // Group Component
  if (options.groupId !== undefined) {
    world.addComponent(entity, 'Group', GroupComponent(options.groupId));
  }

  // INVENTORY
  world.addComponent(entity, 'Inventory', InventoryComponent());

  // MONEY
  world.addComponent(entity, 'Money', MoneyComponent(100));

  // WAITING
  world.addComponent(entity, 'Waiting', WaitingComponent());

  // Demand Component
  if (options.demand !== undefined) {
    const { good, reservationPrice, quantity } = options.demand;
    world.addComponent(entity, 'Demand', DemandComponent(good, reservationPrice, quantity));
  }

  // Supply Component (optional for future use)
  if (options.supply !== undefined) {
    const { good, reservationPrice, quantity } = options.supply;
    world.addComponent(entity, 'Supply', SupplyComponent(good, reservationPrice, quantity));
  }

  if (options.worker !== undefined) {
    const { expectedWage } = options.worker;
    world.addComponent(entity, 'Worker', WorkerComponent(expectedWage));
  }

  return entity;
}