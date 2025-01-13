// sketch.js

import { World } from './modules/core/World.js';
import { MovementSystem } from './modules/systems/MovementSystem.js';
import { RenderSystem } from './modules/systems/RenderSystem.js';
import { generateTileMap } from './modules/tile/TileMap.js';
import { TileRenderSystem } from './modules/systems/TileRenderSystem.js';
import { InputSystem } from './modules/systems/InputSystem.js';
import { TreeInteractionSystem } from './modules/systems/TreeInteractionSystem.js';
import { BuildingSystem } from './modules/systems/BuildingSystem.js';
import { FollowerSystem } from './modules/systems/FollowerSystem.js';
import { FollowerRenderSystem } from './modules/systems/FollowerRenderSystem.js';
import { FollowerComponent } from './modules/components/Follower.js';
import { AgentManager } from './modules/managers/AgentManager.js';

// Agent-related systems
import { WanderingSystem } from './modules/systems/WanderingSystem.js';
import { GroupWanderingSystem } from './modules/systems/GroupWanderingSystem.js';
import { PathFollowingSystem } from './modules/systems/PathFollowingSystem.js';
import { AgentRenderSystem } from './modules/systems/AgentRenderSystem.js';
import { SittingSystem } from './modules/systems/SittingSystem.js';
import { MovementCooldownSystem } from './modules/systems/MovementCooldownSystem.js';
import { EmotionTypes } from './modules/components/Emotion.js';

import { WindArrowSystem } from './modules/systems/WindArrowSystem.js';
import { WindArrowRenderSystem } from './modules/systems/WindArrowRenderSystem.js';
import { PortraitRenderSystem } from './modules/systems/PortraitRenderSystem.js';
import { CardSystem } from './modules/systems/CardSystem.js';

let world;
let movementSystem;
let renderSystem;
let tileRenderSystem;
let inputSystem;
let treeInteractionSystem;
let buildingSystem;
let playerEntity;
const worldWidth = 2000;
const worldHeight = 2000;
let scaleFactor = 3.0;  // For zooming
let followerSystem;
let followerRenderSystem;
let followerEntity;
let agentManager;

// Agent-related systems
let wanderingSystem;
let groupWanderingSystem;
let pathFollowingSystem;
let agentRenderSystem;
let sittingSystem;
let movementCooldownSystem;

let windSystem;
let windRenderSystem;
let portraitSystem;
let cardSystem;

document.oncontextmenu = () => false;  // Disable default right-click menu

window.setup = function() {
  createCanvas(windowWidth, windowHeight);
  
  // Initialize World
  world = new World();

  // Initialize Systems
  movementSystem = new MovementSystem();
  renderSystem = new RenderSystem();
  tileRenderSystem = new TileRenderSystem();
  inputSystem = new InputSystem();
  treeInteractionSystem = new TreeInteractionSystem();
  buildingSystem = new BuildingSystem();
  followerSystem = new FollowerSystem();
  followerRenderSystem = new FollowerRenderSystem();
  windSystem = new WindArrowSystem();
  windRenderSystem = new WindArrowRenderSystem(windSystem);
  renderSystem = new RenderSystem();
  portraitSystem = new PortraitRenderSystem();
  cardSystem = new CardSystem();

  // Initialize Agent Systems
  movementCooldownSystem = new MovementCooldownSystem();
  sittingSystem = new SittingSystem();
  wanderingSystem = new WanderingSystem();
  groupWanderingSystem = new GroupWanderingSystem();
  pathFollowingSystem = new PathFollowingSystem();
  agentRenderSystem = new AgentRenderSystem();

  // Add Systems to System Manager or manage manually
  // For simplicity, we'll manage manually in the draw loop

  // Generate Tile Map
  generateTileMap();

  // Create Follower Entity
  followerEntity = world.createEntity();
  world.addComponent(followerEntity, 'Position', { x: 400, y: 400 });
  world.addComponent(followerEntity, 'Velocity', { vx: 0, vy: 0 });
  world.addComponent(followerEntity, 'Emotion', { type: EmotionTypes.HAPPY });
  world.addComponent(followerEntity, 'Follower', FollowerComponent({
    name: "Follower",
    // Additional data
  }));

  // Create Player Entity
  playerEntity = world.createEntity();
  world.addComponent(playerEntity, 'Position', { x: worldWidth / 2, y: worldHeight / 2 });
  world.addComponent(playerEntity, 'Velocity', { vx: 0, vy: 0 });
  world.addComponent(playerEntity, 'Renderable', { radius: 10, color: 'blue' });

  // Start Follower's Bubble Sequence
  const followerComp = world.getComponent(followerEntity, 'Follower');
  followerSystem.startBubbleSequence(followerComp);

  // Initialize and Create Agents via AgentManager
  agentManager = new AgentManager(world);
  agentManager.initializeAgents();

  //console.log('Setup complete. Player entity:', playerEntity, world.getComponent(playerEntity, 'Position'));
};

window.windowResized = function() {
  resizeCanvas(windowWidth, windowHeight);
};

window.mouseWheel = function(event) {
  scaleFactor *= (event.delta > 0) ? 0.9 : 1.1;
  return false;
};

window.mousePressed = function() {
  // First check if clicked on a card
  const clickedCard = cardSystem.handleClick(mouseX, mouseY);
  if (!clickedCard) {
    // If not, do building
    const selectedCard = cardSystem.getSelectedCard();
    buildingSystem.handleMousePressed(mouseButton, mouseX, mouseY, scaleFactor, playerEntity, world, selectedCard);
  }
};

window.mouseDragged = function() {
  const selectedCard = cardSystem.getSelectedCard();
  buildingSystem.handleMousePressed(mouseButton, mouseX, mouseY, scaleFactor, playerEntity, world, selectedCard);
};

window.draw = function() {
  background(20);
  const playerPos = world.getComponent(playerEntity, 'Position');
  if (!playerPos) return;

  push();
  translate(width / 2, height / 2);
  scale(scaleFactor);
  translate(-playerPos.x, -playerPos.y);

  // Update Systems in the correct order
  // 1. MovementCooldownSystem
  movementCooldownSystem.update(world);
  
  // 2. SittingSystem
  sittingSystem.update(world);

  // 3. InputSystem
  inputSystem.update(world, playerEntity);
  
  // 4. Movement Systems
  wanderingSystem.update(world);
  groupWanderingSystem.update(world);
  pathFollowingSystem.update(world);
  movementSystem.update(world);

  // 5. Other Systems
  treeInteractionSystem.update(world, playerEntity);
  tileRenderSystem.update(world, playerEntity, scaleFactor);

  // 6. Follower System
  followerSystem.update(world, playerEntity);

  // 7. Render Systems
  renderSystem.update(world);
  
  // 8. Render Follower
  followerRenderSystem.update(world, this); // 'this' refers to p5 instance

  // 9. Render Agents
  agentRenderSystem.update(world, this); // 'this' refers to p5 instance

  windSystem.update(world, deltaTime);

  windRenderSystem.update(world, this);

  // 10. Draw World Boundaries
  noFill();
  stroke(0);
  rect(0, 0, worldWidth, worldHeight);

  // 11. Draw the Preview of Tile Placement
  buildingSystem.drawPreview(mouseX, mouseY, scaleFactor, playerEntity, world);
  buildingSystem.updateDraw(this);
  
  pop();

  // Update UI states, then draw
  cardSystem.update(this);   // check hover
  cardSystem.draw(this);
  portraitSystem.update(this); // top-left face
};
