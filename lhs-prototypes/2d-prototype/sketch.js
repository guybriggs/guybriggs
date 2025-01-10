import { World } from './modules/core/World.js';
import { MovementSystem } from './modules/systems/MovementSystem.js';
import { RenderSystem } from './modules/systems/RenderSystem.js';
import { generateTileMap } from './modules/tile/TileMap.js';
import { TileRenderSystem } from './modules/systems/TileRenderSystem.js';
import { InputSystem } from './modules/systems/InputSystem.js';
import { TreeInteractionSystem } from './modules/systems/TreeInteractionSystem.js';

let world;
let movementSystem;
let renderSystem;
let tileRenderSystem;
let inputSystem;
let treeInteractionSystem;
let playerEntity;
const worldWidth = 2000;
const worldHeight = 2000;
let scaleFactor = 1.0;  // For zooming

window.setup = function() {
  createCanvas(800, 600);
  
  world = new World();
  movementSystem = new MovementSystem();
  renderSystem = new RenderSystem();
  tileRenderSystem = new TileRenderSystem();
  inputSystem = new InputSystem();
  treeInteractionSystem = new TreeInteractionSystem();

  generateTileMap();

  playerEntity = world.createEntity();
  world.addComponent(playerEntity, 'Position', { x: worldWidth / 2, y: worldHeight / 2 });
  world.addComponent(playerEntity, 'Velocity', { vx: 0, vy: 0 });
  // Make player size equal to a tile
  world.addComponent(playerEntity, 'Renderable', { radius: 10, color: 'blue' });

  console.log('Setup complete. Player entity:', playerEntity, world.getComponent(playerEntity, 'Position'));
};

// Register mouse wheel event handler for zooming
window.mouseWheel = function(event) {
  // event.delta > 0 for zoom out, < 0 for zoom in
  scaleFactor *= (event.delta > 0) ? 0.9 : 1.1;
  return false; // prevent default
};

window.draw = function() {
  background(220);
  const playerPos = world.getComponent(playerEntity, 'Position');
  if (!playerPos) return;

  push();
  // Center view on player with zoom
  translate(width/2, height/2);
  scale(scaleFactor);
  translate(-playerPos.x, -playerPos.y);

  inputSystem.update(world, playerEntity);
  movementSystem.update(world);
  treeInteractionSystem.update(world, playerEntity);
  tileRenderSystem.update(world, playerEntity, scaleFactor);

  noFill();
  stroke(0);
  rect(0, 0, worldWidth, worldHeight);

  renderSystem.update(world);
  pop();
};
