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
import { WanderingSystem } from './modules/systems/WanderingSystem.js';
import { GroupWanderingSystem } from './modules/systems/GroupWanderingSystem.js';
import { PathFollowingSystem } from './modules/systems/PathFollowingSystem.js';
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

let world, movementSystem, renderSystem, tileRenderSystem,
    inputSystem, treeInteractionSystem, buildingSystem, followerSystem,
    followerRenderSystem, agentRenderSystem, supplierAttractionSystem,
    forestInteractionSystem, windFollowerInteractionSystem, movementCooldownSystem,
    sittingSystem, wanderingSystem, groupWanderingSystem, pathFollowingSystem,
    windSystem, windRenderSystem, portraitSystem, cardSystem, damageRenderSystem,
    constructionSystem, buildingCostSystem, agentManager, playerEntity, followerEntity,
    workAttractionSystem, fishingSystem;

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
  wanderingSystem = new WanderingSystem();
  groupWanderingSystem = new GroupWanderingSystem();
  pathFollowingSystem = new PathFollowingSystem();
  windSystem = new WindArrowSystem();
  windRenderSystem = new WindArrowRenderSystem(windSystem);
  damageRenderSystem = new DamageRenderSystem();
  workAttractionSystem = new WorkAttractionSystem();
  fishingSystem = new FishingSystem(world, buildingSystem);
  constructionSystem = new ConstructionSystem();
  buildingCostSystem = new BuildingCostSystem();
  portraitSystem = new PortraitRenderSystem();
  cardSystem = new CardSystem();

  // Create a player entity with Money component
  playerEntity = world.createEntity();
  world.addComponent(playerEntity, 'Position', { x: worldWidth / 2, y: worldHeight / 2 });
  world.addComponent(playerEntity, 'Velocity', { vx: 0, vy: 0 });
  world.addComponent(playerEntity, 'Renderable', { radius: 10, color: 'blue' });
  world.addComponent(playerEntity, 'Money', MoneyComponent(0)); // Start with $0

  // Create a follower entity
  followerEntity = world.createEntity();
  world.addComponent(followerEntity, 'Position', { x: 400, y: 400 });
  world.addComponent(followerEntity, 'Velocity', { vx: 0, vy: 0 });
  world.addComponent(followerEntity, 'Emotion', { type: EmotionTypes.HAPPY });
  world.addComponent(followerEntity, 'Follower', FollowerComponent({ name: "Follower" }));
  followerSystem.startBubbleSequence(world.getComponent(followerEntity, 'Follower'));

  agentManager = new AgentManager(world);
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
    wanderingSystem.update(world);
    groupWanderingSystem.update(world);
    pathFollowingSystem.update(world);
    movementSystem.update(world);
    treeInteractionSystem.update(world, playerEntity);
    tileRenderSystem.update(world, playerEntity, scaleFactor);
    followerSystem.update(world, playerEntity);
    renderSystem.update(world);
    windSystem.update(world, deltaTime);
    windRenderSystem.update(world, this);
    supplierAttractionSystem.update(deltaTime);
  workAttractionSystem.update(world, deltaTime);
  fishingSystem.update(deltaTime);

    noFill(); stroke(0);
    rect(0, 0, worldWidth, worldHeight);

    buildingSystem.drawPreview(mouseX, mouseY, scaleFactor, playerEntity, world);

    // 1) Draw all non-grid buildings (beds/tables) first
    buildingSystem.updateDraw(this);

    // 2) Then draw your agents on top
    agentRenderSystem.update(world, this);
    followerRenderSystem.update(world, this);

    damageRenderSystem.update(this);
    constructionSystem.update(world);
  pop();

  // After building placements, handle cost
  buildingCostSystem.update(world);

  forestInteractionSystem.update(world, followerEntity);
  windFollowerInteractionSystem.update(world, windSystem);
  cardSystem.update(this);
  cardSystem.draw(this);
  portraitSystem.update(this, world);
};

window.windowResized = () => resizeCanvas(windowWidth, windowHeight);
window.mouseWheel = e => (scaleFactor *= (e.delta > 0) ? 0.9 : 1.1) && false;
window.mousePressed = () => {
  if (!cardSystem.handleClick(mouseX, mouseY)) {
    const sel = cardSystem.getSelectedCard();

    // Handle right-click for updating wage on fishing rods
    if(mouseButton === RIGHT) {
      // Prevent prompt if one is active
      if(buildingSystem.promptActive) return;

      const clickedRod = buildingSystem.getFishingRodAt(mouseX, mouseY, scaleFactor, playerEntity);
      if(clickedRod) {
        buildingSystem.promptWageChange(clickedRod);
        return;
      }
    }

    buildingSystem.handleMousePressed(mouseButton, mouseX, mouseY, scaleFactor, playerEntity, world, sel);
  }
};

window.mouseDragged = () => {
  const sel = cardSystem.getSelectedCard();
  buildingSystem.handleMousePressed(mouseButton, mouseX, mouseY, scaleFactor, playerEntity, world, sel);
};

window.mouseReleased = function() {
  // If the user releases the left mouse, tell buildingSystem to reset
  if (mouseButton === LEFT) {
    buildingSystem.stopDrag();
  }
};

window.mouseDragged = function() {
  const selectedCard = cardSystem.getSelectedCard();
  // If left mouse is being dragged
  if (mouseButton === LEFT) {
    buildingSystem.handleMousePressed(mouseButton, mouseX, mouseY, scaleFactor, playerEntity, world, selectedCard);
  }
};

window.mouseReleased = () => {
  if (mouseButton === LEFT) {
    buildingSystem.stopDrag();
  }
};
