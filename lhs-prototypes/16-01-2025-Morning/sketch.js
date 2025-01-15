// sketch.js

import { World } from './modules/core/World.js';
import { MovementSystem } from './modules/systems/MovementSystem.js';
import { RenderSystem } from './modules/systems/RenderSystem.js';
import { TileRenderSystem } from './modules/systems/TileRenderSystem.js';
import { InputSystem } from './modules/systems/InputSystem.js';
import { TreeInteractionSystem } from './modules/systems/TreeInteractionSystem.js';
import { FollowerSystem } from './modules/systems/FollowerSystem.js';
import { FollowerRenderSystem } from './modules/systems/FollowerRenderSystem.js';
import { AgentRenderSystem } from './modules/systems/AgentRenderSystem.js';
import { SupplierAttractionSystem } from './modules/systems/SupplierAttractionSystem.js';
import { ForestInteractionSystem } from './modules/systems/ForestInteractionSystem.js';
import { WindFollowerInteractionSystem } from './modules/systems/WindFollowerInteractionSystem.js';
import { MovementCooldownSystem } from './modules/systems/MovementCooldownSystem.js';
import { SittingSystem } from './modules/systems/SittingSystem.js';
import { RandomlyMoveSystem } from './modules/systems/RandomlyMoveSystem.js';
import { WindArrowSystem } from './modules/systems/WindArrowSystem.js';
import { WindArrowRenderSystem } from './modules/systems/WindArrowRenderSystem.js';
import { PortraitRenderSystem } from './modules/systems/PortraitRenderSystem.js';
import { CardSystem } from './modules/systems/CardSystem.js';
import { DamageRenderSystem } from './modules/systems/DamageRenderSystem.js';
import { WorkAttractionSystem } from './modules/systems/WorkAttractionSystem.js';
import { FishingSystem } from './modules/systems/FishingSystem.js';
import { ConstructionSystem } from './modules/systems/ConstructionSystem.js';
import { BuildingSystem } from './modules/systems/BuildingSystem.js';
import { AgentManager } from './modules/managers/AgentManager.js';
import { generateTileMap } from './modules/tile/TileMap.js';

import { EmotionTypes } from './modules/components/Emotion.js';
import { FollowerComponent } from './modules/components/Follower.js';
import { MoneyComponent } from './modules/components/Money.js';
import { BuildingCostSystem } from './modules/systems/BuildingCostSystem.js';
import { ApartmentSystem } from './modules/systems/ApartmentSystem.js';
import { TradeSystem } from './modules/systems/TradeSystem.js';

import { createAgent } from './modules/factories/AgentFactory.js';
import { WorkerAssignmentSystem } from './modules/systems/WorkerAssignmentSystem.js';
import { CollisionSystem } from './modules/systems/CollisionSystem.js';

let world,
    movementSystem, renderSystem, tileRenderSystem, inputSystem,
    treeInteractionSystem, buildingSystem, followerSystem, followerRenderSystem,
    agentRenderSystem, supplierAttractionSystem, forestInteractionSystem,
    windFollowerInteractionSystem, movementCooldownSystem, sittingSystem,
    randomlyMoveSystem, windSystem,
    windRenderSystem, portraitSystem, cardSystem, damageRenderSystem,
    constructionSystem, buildingCostSystem, agentManager, playerEntity,
    followerEntity, workAttractionSystem, fishingSystem,
    apartmentSystem, tradeSystem,workerAssignmentSystem, collisionSystem; // We'll store the instance here

const worldWidth = 2000, worldHeight = 2000;
let scaleFactor = 3.0;

document.oncontextmenu = () => false;

window.setup = function() {
  createCanvas(windowWidth, windowHeight);
  world = new World();
  generateTileMap();

  movementSystem = new MovementSystem();
  renderSystem = new RenderSystem();
  tileRenderSystem = new TileRenderSystem();
  inputSystem = new InputSystem();
  treeInteractionSystem = new TreeInteractionSystem();
  buildingSystem = new BuildingSystem(world);
  followerSystem = new FollowerSystem();
  followerRenderSystem = new FollowerRenderSystem();
  agentRenderSystem = new AgentRenderSystem();
  supplierAttractionSystem = new SupplierAttractionSystem(world);
  forestInteractionSystem = new ForestInteractionSystem();
  windFollowerInteractionSystem = new WindFollowerInteractionSystem();
  movementCooldownSystem = new MovementCooldownSystem();
  sittingSystem = new SittingSystem();
  randomlyMoveSystem = new RandomlyMoveSystem();
  windSystem = new WindArrowSystem();
  windRenderSystem = new WindArrowRenderSystem(windSystem);
  damageRenderSystem = new DamageRenderSystem();
  workAttractionSystem = new WorkAttractionSystem();
  fishingSystem = new FishingSystem(world, buildingSystem);
  constructionSystem = new ConstructionSystem();
  buildingCostSystem = new BuildingCostSystem();
  portraitSystem = new PortraitRenderSystem();
  cardSystem = new CardSystem();
  tradeSystem = new TradeSystem();
  workerAssignmentSystem = new WorkerAssignmentSystem();

  // Create ApartmentSystem instance
  apartmentSystem = new ApartmentSystem();

  // Player w/ money
  playerEntity = world.createEntity();
  world.addComponent(playerEntity, 'Position', { x: worldWidth / 2, y: worldHeight / 2 });
  world.addComponent(playerEntity, 'Velocity', { vx: 0, vy: 0 });
  world.addComponent(playerEntity, 'Renderable', { radius: 10, color: 'blue' });
  world.addComponent(playerEntity, 'Money', MoneyComponent(0));
  
  collisionSystem = new CollisionSystem(playerEntity);

  // A simple follower
  followerEntity = world.createEntity();
  world.addComponent(followerEntity, 'Position', { x: 400, y: 400 });
  world.addComponent(followerEntity, 'Velocity', { vx: 0, vy: 0 });
  world.addComponent(followerEntity, 'Emotion', { type: EmotionTypes.HAPPY });
  world.addComponent(followerEntity, 'Follower', FollowerComponent({ name: "Follower" }));
  followerSystem.startBubbleSequence(world.getComponent(followerEntity, 'Follower'));

  agentManager = new AgentManager(world);
  // Override createWorkerAgents to limit to 3 workers near center
  agentManager.createWorkerAgents = function(count) {
    const maxWorkers = 3;
    const centerX = worldWidth / 2;
    const centerY = worldHeight / 2;
    const spawnRadius = 50;
    for (let i = 0; i < Math.min(count, maxWorkers); i++) {
      const x = centerX + (Math.random() * 2 - 1) * spawnRadius;
      const y = centerY + (Math.random() * 2 - 1) * spawnRadius;
      const agent = createAgent(this.world, { 
        emotion: EmotionTypes.NEUTRAL,
        worker: { expectedWage: 8 },
        x, 
        y
      });
      const rend = this.world.getComponent(agent, 'Renderable');
      if (rend) {
        rend.helmet = true;
      }
    }
  };
  agentManager.initializeAgents();

};

window.draw = function() {
  background(20);
  const playerPos = world.getComponent(playerEntity, 'Position');
  if (!playerPos) return;

  push();
    translate(width / 2, height / 2);
    scale(scaleFactor);
    translate(-playerPos.x, -playerPos.y);

    movementCooldownSystem.update(world);
    sittingSystem.update(world);
    inputSystem.update(world, playerEntity);
    randomlyMoveSystem.update(world);
    treeInteractionSystem.update(world, playerEntity);
    tileRenderSystem.update(world, playerEntity, scaleFactor);
    followerSystem.update(world, playerEntity);
    renderSystem.update(world);
    windSystem.update(world, deltaTime);
    windRenderSystem.update(world, this);
    supplierAttractionSystem.update(deltaTime);
    workAttractionSystem.update(world, deltaTime);
    fishingSystem.update(deltaTime);
    workerAssignmentSystem.update(world);

    // Let the ApartmentSystem check for 4 floors + key
    apartmentSystem.update(world, deltaTime);
    tradeSystem.update(world, deltaTime);

    collisionSystem.update(world); // collision first!
    movementSystem.update(world); // then movement with the updated velocities.

    noFill();
    stroke(0);
    rect(0, 0, worldWidth, worldHeight);

    buildingSystem.drawPreview(mouseX, mouseY, scaleFactor, playerEntity, world);
    buildingSystem.updateDraw(this);

    // Agents on top
    agentRenderSystem.update(world, this);
    followerRenderSystem.update(world, this);

    damageRenderSystem.update(this);
    constructionSystem.update(world);
  pop();

  // After building
  buildingCostSystem.update(world);

  forestInteractionSystem.update(world, followerEntity);
  windFollowerInteractionSystem.update(world, windSystem);

  cardSystem.update(this);
  cardSystem.draw(this, world);
    // Check for apartment completion and display label above card UI
  if (world.apartmentComplete) {
    let message = "Apartment made!";

    // Check for a bed in non-grid buildings
    let hasBed = false;
    const bSys = buildingSystem; // reference to building system
    if (bSys) {
      for (let b of bSys.nonGridBuildings) {
        if (b.type === 'bed') {
          hasBed = true;
          break;
        }
      }
    }
    
    // If a bed is found, update the message
    if (hasBed) {
      message = "Good apartment made!";
    }

    push();
    fill(255); 
    textSize(24);
    textAlign(CENTER, BOTTOM);
    // Position the text above the card UI
    const labelX = width / 2;
    const labelY = height - 100;  // adjust as needed to be above the card UI
    text(message, labelX, labelY);
    pop();
  }

  portraitSystem.update(this, world);
};

window.windowResized = () => resizeCanvas(windowWidth, windowHeight);

window.mouseWheel = (e) => {
  scaleFactor *= (e.delta > 0) ? 0.9 : 1.1;
  return false;
};

window.mousePressed = () => {
  if (!cardSystem.handleClick(mouseX, mouseY)) {
    const sel = cardSystem.getSelectedCard();

    if (mouseButton === RIGHT) {
      const clickedRod = buildingSystem.getFishingRodAt(mouseX, mouseY, scaleFactor, playerEntity);
      if (clickedRod) {
        buildingSystem.promptWageChange(clickedRod);
        return;
      }
    }

    buildingSystem.handleMousePressed(
      mouseButton, mouseX, mouseY, scaleFactor, playerEntity, world, sel
    );
  }
};

window.mouseDragged = () => {
  const sel = cardSystem.getSelectedCard();
  buildingSystem.handleMousePressed(
    mouseButton, mouseX, mouseY, scaleFactor, playerEntity, world, sel
  );
};

window.mouseReleased = () => {
  if (mouseButton === LEFT) {
    buildingSystem.stopDrag();
  }
};

window.mouseDragged = function() {
  const sel = cardSystem.getSelectedCard();
  if (mouseButton === LEFT) {
    buildingSystem.handleMousePressed(
      mouseButton, mouseX, mouseY, scaleFactor, playerEntity, world, sel
    );
  }
};

window.mouseReleased = () => {
  if (mouseButton === LEFT) {
    buildingSystem.stopDrag();
  }
};
