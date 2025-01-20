// sketch.js

import { World } from './modules/core/World.js';
import { MovementSystem } from './modules/systems/MovementSystem.js';
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
import { RandomlyMoveSystem } from './modules/systems/RandomlyMoveSystem.js';
import { WindArrowSystem } from './modules/systems/WindArrowSystem.js';
import { WindArrowRenderSystem } from './modules/systems/WindArrowRenderSystem.js';
import { PortraitRenderSystem } from './modules/systems/PortraitRenderSystem.js';
import { CardSystem } from './modules/systems/CardSystem.js';
import { DamageRenderSystem } from './modules/systems/DamageRenderSystem.js';
import { ConstructionSystem } from './modules/systems/ConstructionSystem.js';
import { BuildingSystem } from './modules/systems/BuildingSystem.js';
import { AgentManager } from './modules/managers/AgentManager.js';
import { generateTileMap } from './modules/tile/TileMap.js';
import { FollowerComponent } from './modules/components/Follower.js';
import { BuildingCostSystem } from './modules/systems/BuildingCostSystem.js';
import { ApartmentSystem } from './modules/systems/ApartmentSystem.js';
import { createAgent } from './modules/factories/AgentFactory.js';
import { WorkerAssignmentSystem } from './modules/systems/WorkerAssignmentSystem.js';
import { CollisionSystem } from './modules/systems/CollisionSystem.js';
import { GoalMovementSystem } from './modules/systems/GoalMovementSystem.js';
import { TalkInteractionSystem } from './modules/systems/TalkInteractionSystem.js';
import { DirectionSystem } from './modules/systems/DirectionSystem.js';
import { ParticleSystem } from './modules/systems/ParticleSystem.js';
import { ParticleRenderSystem } from './modules/systems/ParticleRenderSystem.js';
import { AgentParticleEmitterSystem } from './modules/systems/AgentParticleEmitterSystem.js';
import { TileParticleEmitterSystem } from './modules/systems/TileParticleEmitterSystem.js';
import { AllAgentsUISystem } from './modules/systems/AllAgentsUISystem.js';
import { FoodDecaySystem } from './modules/systems/FoodDecaySystem.js';

// Because we need to search for fishing rod tiles
import { tileMap, tileSize, mapRows, mapCols } from './modules/tile/TileMap.js';

let world,
    movementSystem, tileRenderSystem, inputSystem,
    treeInteractionSystem, buildingSystem, followerSystem, followerRenderSystem,
    agentRenderSystem, supplierAttractionSystem, forestInteractionSystem,
    windFollowerInteractionSystem, movementCooldownSystem,
    randomlyMoveSystem, windSystem,
    windRenderSystem, portraitSystem, cardSystem, damageRenderSystem,
    constructionSystem, buildingCostSystem, agentManager, playerEntity,
    followerEntity,
    apartmentSystem, workerAssignmentSystem, collisionSystem,
    goalMovementSystem, talkInteractionSystem, directionSystem,
    particleSystem, particleRenderSystem, agentParticleEmitterSystem,
    tileParticleEmitterSystem, allAgentsUISystem, foodDecaySystem;

const worldWidth = 2000, worldHeight = 2000;
let scaleFactor = 3.0;

document.oncontextmenu = () => false;

window.setup = function() {
  createCanvas(windowWidth, windowHeight);
  world = new World();
  generateTileMap();

  movementSystem = new MovementSystem();
  tileRenderSystem = new TileRenderSystem();
  treeInteractionSystem = new TreeInteractionSystem();
  buildingSystem = new BuildingSystem(world);
  followerSystem = new FollowerSystem();
  followerRenderSystem = new FollowerRenderSystem();
  agentRenderSystem = new AgentRenderSystem();
  supplierAttractionSystem = new SupplierAttractionSystem(world);
  forestInteractionSystem = new ForestInteractionSystem();
  windFollowerInteractionSystem = new WindFollowerInteractionSystem();
  movementCooldownSystem = new MovementCooldownSystem();
  randomlyMoveSystem = new RandomlyMoveSystem();
  windSystem = new WindArrowSystem();
  windRenderSystem = new WindArrowRenderSystem(windSystem);
  damageRenderSystem = new DamageRenderSystem();
  constructionSystem = new ConstructionSystem();
  buildingCostSystem = new BuildingCostSystem();
  portraitSystem = new PortraitRenderSystem();
  cardSystem = new CardSystem();
  inputSystem = new InputSystem(cardSystem);
  workerAssignmentSystem = new WorkerAssignmentSystem();
  goalMovementSystem = new GoalMovementSystem(1, 5);
  talkInteractionSystem = new TalkInteractionSystem(100);
  apartmentSystem = new ApartmentSystem();
  directionSystem = new DirectionSystem();
  particleSystem = new ParticleSystem();
  particleRenderSystem = new ParticleRenderSystem();
  agentParticleEmitterSystem = new AgentParticleEmitterSystem();
  tileParticleEmitterSystem = new TileParticleEmitterSystem(world);
  allAgentsUISystem = new AllAgentsUISystem();
  foodDecaySystem = new FoodDecaySystem();

  playerEntity = createAgent(world); // the player
  world.addComponent(playerEntity, 'Player', { /* Player-specific data */ });

  let playerNameComp = world.getComponent(playerEntity, 'Name');
  playerNameComp.firstName = '';

  collisionSystem = new CollisionSystem(playerEntity); // initialise collision system

  followerEntity = createAgent(world); // a single follower
  world.addComponent(followerEntity, 'Follower', FollowerComponent({ name: "Follower" }));
  followerSystem.startBubbleSequence(world.getComponent(followerEntity, 'Follower'));

  agentManager = new AgentManager(world);
  agentManager.initializeAgents(); // create agents around the world
};

window.draw = function() {
  background(20);

  const playerPos = world.getComponent(playerEntity, 'Position');
  if (!playerPos) return;

  // ------------------------------------------------------------------------
  // 1) Find distance to nearest fishing rod tile, then swap decks accordingly
  // ------------------------------------------------------------------------
  function findClosestTileOfType(tileType, px, py) {
    let minDistSq = Infinity;
    for (let row = 0; row < mapRows; row++) {
      for (let col = 0; col < mapCols; col++) {
        if (tileMap[row][col].type === tileType) {
          const tileCenterX = col * tileSize + tileSize / 2;
          const tileCenterY = row * tileSize + tileSize / 2;
          const dx = px - tileCenterX;
          const dy = py - tileCenterY;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDistSq) {
            minDistSq = distSq;
          }
        }
      }
    }
    return Math.sqrt(minDistSq);
  }

  const distToFishingRod = findClosestTileOfType('fishingrod', playerPos.x, playerPos.y);
  const threshold = 30; // distance threshold
  if (distToFishingRod < threshold) {
    cardSystem.swapToFishingRodDeck();
  } else {
    cardSystem.swapToDefaultDeck();
  }
  // ------------------------------------------------------------------------

  push();
    translate(width / 2, height / 2);
    scale(scaleFactor);
    translate(-playerPos.x, -playerPos.y);

    noFill();
    stroke(0);
    rect(0, 0, worldWidth, worldHeight);

    movementCooldownSystem.update(world);
    goalMovementSystem.update(world, deltaTime);
    treeInteractionSystem.update(world, playerEntity);
    tileRenderSystem.update(world, playerEntity, scaleFactor);
    followerSystem.update(world, playerEntity);
    windSystem.update(world, deltaTime);
    windRenderSystem.update(world, this);
    supplierAttractionSystem.update(deltaTime);
    workerAssignmentSystem.update(world);
    randomlyMoveSystem.update(world);
    apartmentSystem.update(world, deltaTime);
    foodDecaySystem.update(world, deltaTime);

    directionSystem.update(world, deltaTime); // direction!
    inputSystem.update(world, playerEntity);   // keyboard presses overwrite direction!
    collisionSystem.update(world);             // collision!
    movementSystem.update(world);              // then movement with the updated velocities.

    agentParticleEmitterSystem.update(world);
    tileParticleEmitterSystem.update();
    particleSystem.update(world, deltaTime);
    particleRenderSystem.update(world, this);

    buildingSystem.drawPreview(mouseX, mouseY, scaleFactor, playerEntity, world);

    agentRenderSystem.update(world, this);
    followerRenderSystem.update(world, this);
    damageRenderSystem.update(this);
    constructionSystem.update(world);
  pop();

  buildingCostSystem.update(world);
  forestInteractionSystem.update(world, followerEntity);
  windFollowerInteractionSystem.update(world, windSystem);

  // Update & draw the card system after we decide which deck to show
  cardSystem.update(this);
  cardSystem.draw(this, world);

  portraitSystem.update(this, world);
  allAgentsUISystem.update(this, world);
};

window.windowResized = () => resizeCanvas(windowWidth, windowHeight);

window.mouseWheel = (e) => {
  scaleFactor *= (e.delta > 0) ? 0.9 : 1.1;
  return false;
};

window.mousePressed = () => {
  if (!cardSystem.handleClick(mouseX, mouseY)) {
    const sel = cardSystem.getSelectedCard();
    buildingSystem.handleMousePressed(
      mouseButton, mouseX, mouseY, scaleFactor, playerEntity, world, sel
    );
  }
};

// ---- DUPLICATE #1: mouseDragged ----
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

// ---- DUPLICATE #2: mouseDragged ----
window.mouseDragged = function() {
  const sel = cardSystem.getSelectedCard();
  if (mouseButton === LEFT) {
    buildingSystem.handleMousePressed(
      mouseButton, mouseX, mouseY, scaleFactor, playerEntity, world, sel
    );
  }
};

// ---- DUPLICATE #2: mouseReleased ----
window.mouseReleased = () => {
  if (mouseButton === LEFT) {
    buildingSystem.stopDrag();
  }
};

window.keyPressed = function() {
  if (key.toLowerCase() === 'e') {
    talkInteractionSystem.attemptTalk(world, playerEntity);
  }

  if (key.toLowerCase() === 'q') {
    allAgentsUISystem.toggle();
  }
};
