// modules/systems/BuildingSystem.js

import { tileSize, tileMap, mapCols, mapRows } from '../tile/TileMap.js';
import { createAgent } from '../factories/AgentFactory.js';
import { EmotionTypes } from '../components/Emotion.js';
import { isInFullyEnclosedRegion, getHouseWalls } from '../utils/EnvironmentUtils.js';
import { Goods } from '../data/Goods.js';
import { tryCommandeeringWorker } from '../utils/WorkerAssignmentUtils.js';
import { typewriteLine } from '../logic/BubbleLogic.js';
import { gatherEnclosedCells, alreadyHasKeyInRegion } from '../utils/BFSUtils.js';
import { InventoryComponent } from '../components/Inventory.js';

export class BuildingSystem {
  constructor(world) {
    this.world = world;
    this.lastTilePlaced = { row: null, col: null };
    this.isDraggingLeft = false;
    this.promptActive = false;
    this.pendingGridTasks = [];
  }

  stopDrag() {
    this.isDraggingLeft = false;
  }

  handleMousePressed(btn, mx, my, sf, playerEntity, world, selCard) {
    const pp = world.getComponent(playerEntity, 'Position');
    if (!pp || !selCard) return;
    const wx = (mx - width / 2) / sf + pp.x;
    const wy = (my - height / 2) / sf + pp.y;

    // Otherwise, we treat bed, table, key, floor, wall, door as grid-based:
    const col = Math.floor(wx / tileSize);
    const row = Math.floor(wy / tileSize);

    if (col < 0 || row < 0 || col >= mapCols || row >= mapRows) return;
    // Avoid placing multiple times on the same cell in one click-drag
    if (this.lastTilePlaced.row === row && this.lastTilePlaced.col === col) return;

    if (mouseButton === LEFT) {
      this.placeGridBuilding(row, col, selCard);
      this.lastTilePlaced = { row, col };
    } else if (mouseButton === RIGHT) {
      this.removeGridBuilding(row, col);
      this.lastTilePlaced = { row, col };
    }
  }

  placeGridBuilding(r, c, t) {
    // If it's forest => remove tree
    if (tileMap[r][c].type === 'forest') {
      tileMap[r][c].hasTree = false;
      // optionally tileMap[r][c].type = 'grassland';
    }
  
    // 'key' checks for floor, enclosed BFS, etc.
    if (t === 'key') {
      const tileHere = tileMap[r][c];
      if (tileHere.type !== 'floor') {
        console.log("Can't place a key unless on floor");
        return;
      }
      const enclosed = gatherEnclosedCells(c, r);
      if (!enclosed) {
        console.log("This floor is not enclosed => can't place key");
        return;
      }
      if (alreadyHasKeyInRegion(c, r)) {
        console.log("This region already has a key, ignoring second key");
        return;
      }
    }

    // Mark as blueprint
    tileMap[r][c] = {
      type: t,
      hasTree: false,
      regenTime: 0,
      transparent: true,
      claimed: -1, // indicates that it has not been taken,
      inventory: InventoryComponent(),
    };

    // Enqueue new building
    if (!this.world.placedBuildingsForAssignmentQueue) {
      this.world.placedBuildingsForAssignmentQueue = [];
    }
    if (!this.world.placedBuildingsForCostQueue) {
      this.world.placedBuildingsForCostQueue = [];
    }
    const newTask = { type: t, row: r, col: c };
    this.world.placedBuildingsForAssignmentQueue.push(newTask);
    this.world.placedBuildingsForCostQueue.push(newTask);
  
    // Attempt to commandeer a worker
    let commandeeredWorker = tryCommandeeringWorker(this.world, t, r, c);
    const acceptablePrice = 10;
    if (!commandeeredWorker) {
      const supplyAgents = this.world.getEntitiesByComponents(['Supply','Position']);
      let overDemandWorker = null;
      for (let agentId of supplyAgents) {
        const supply = this.world.getComponent(agentId, 'Supply');
        if (supply && supply.reservationPrice > acceptablePrice && supply.good == Goods.BRICK) {
          overDemandWorker = agentId;
          break;
        }
      }
      if (overDemandWorker) {
        console.log(`Worker ${overDemandWorker} demands better wages for tile: ${t}`);
        const pos = this.world.getComponent(overDemandWorker, 'Position');
        if (pos) {
          pos.x = r * tileSize + tileSize / 2;
          pos.y = c * tileSize + tileSize / 2;
        }
        const messages = [
          'I demand better wages.',
          'Awful wages.',
          "Nice blueprint, that I won't build."
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.world.addComponent(overDemandWorker, 'SpeechBubble', {
          textOptions: messages,
          fullText: randomMessage,
          typed: '',
          index: 0,
          visible: true,
          xOffset: 0,
          yOffset: -40,
          bubbleColor: 'white',
          textColor: '#ffffff'
        });
        this.world.addComponent(overDemandWorker, 'GoalPosition', {
          x: r * tileSize + tileSize / 2,
          y: c * tileSize + tileSize / 2
        });
      } else {
        console.log(`No available worker found for building type: ${t}`);
      }
    }
  
    // If 'key', spawn red-helmet worker
    if (t === 'key') {
      this.spawnKeyWorker(c * tileSize + tileSize / 2, r * tileSize + tileSize / 2);
    }
  
    // ======= TELEPORT all free workers around the blueprint in a ring =======
    const blueprintX = c * tileSize + tileSize / 2;
    const blueprintY = r * tileSize + tileSize / 2;
    const allWorkers = this.world.getEntitiesByComponents(['Worker','Position','Velocity']);
    const freeWorkers = allWorkers.filter(wId => 
      !this.world.hasComponent(wId, 'ConstructionTask')
    );
  
    const radius = 150;
    const count = freeWorkers.length;
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count;
        const crowdX = blueprintX + radius * Math.cos(angle);
        const crowdY = blueprintY + radius * Math.sin(angle);
  
        // Remove RandomlyMove so they won't wander
        if (this.world.hasComponent(freeWorkers[i], 'RandomlyMove')) {
          this.world.removeComponent(freeWorkers[i], 'RandomlyMove');
        }
        // Teleport them directly: set position
        const wPos = this.world.getComponent(freeWorkers[i], 'Position');
        if (wPos) {
          wPos.x = crowdX;
          wPos.y = crowdY;
        }
        // Zero out velocity
        const wVel = this.world.getComponent(freeWorkers[i], 'Velocity');
        if (wVel) {
          wVel.vx = 0;
          wVel.vy = 0;
        }
      }
    }
  }

  removeGridBuilding(r, c) {
    tileMap[r][c] = {
      type: 'grassland',
      hasTree: false,
      regenTime: 0
    };
  }

  spawnKeyWorker(keyX, keyY) {
    const dist = tileSize * 3;
    const angle = Math.random() * TWO_PI;
    const spawnX = keyX + Math.cos(angle) * dist;
    const spawnY = keyY + Math.sin(angle) * dist;
  
    const agentId = createAgent(this.world, {
      idle: true,
      emotion: EmotionTypes.NEUTRAL
    });
  
    // Position / velocity
    const pos = this.world.getComponent(agentId, 'Position');
    if (pos) {
      pos.x = spawnX;
      pos.y = spawnY;
    }
    const velocity = this.world.getComponent(agentId, 'Velocity');
    if (velocity) {
      velocity.vx = 0;
      velocity.vy = 0;
    } else {
      this.world.addComponent(agentId, 'Velocity', { vx: 0, vy: 0 });
    }
  
    // Renderable => red helmet
    const rend = this.world.getComponent(agentId, 'Renderable');
    if (rend) {
      rend.helmet = true;
      rend.helmetColor = 'red';
      rend.color = 'red';
    }
  
    // Speech bubble
    const speechBubble = {
      textOptions: ['Oh, hello!'],
      fullText: 'Oh, hello!',
      typed: '',
      index: 0,
      visible: true,
      xOffset: 0,
      yOffset: -40,
      bubbleColor: 'white',
      textColor: '#ffffff'
    };
    this.world.addComponent(agentId, 'SpeechBubble', speechBubble);
  
    // Greet immediately
    typewriteLine({ speechBubble, bubbleInterval: null }, 'Oh, hello!', 
      () => Math.floor(Math.random() * 100)
    );
  
    // 2 seconds later, check for bed => transform if found
    setTimeout(() => {
      let hasBed = this.findAnyBuiltBed();
      const newMessage = hasBed
        ? "I'll buy this place!"
        : "Awful place...";
  
      speechBubble.fullText = newMessage;
      speechBubble.typed = "";
      speechBubble.index = 0;
      speechBubble.visible = true;
  
      typewriteLine({ speechBubble, bubbleInterval: null }, newMessage,
        () => Math.floor(Math.random() * 100)
      );
  
      // ---- If bed is found => convert them to a real building worker ----
      if (hasBed) {
        // 1) Switch visuals from red => normal worker style
        if (rend) {
          rend.helmet = true;            // keep helmet
          rend.helmetColor = null;       // remove the explicit 'red'
          rend.color = '#E3E763';        // your typical worker color
        }
  
        // 2) Add a Worker component (so WorkerAssignmentSystem can assign them tasks)
        // e.g. typical wage = 8
        if (!this.world.hasComponent(agentId, 'Worker')) {
          this.world.addComponent(agentId, 'Worker', { expectedWage: 8 });
        }
  
        // 3) Add a Supply component for bricks 
        // so WorkerAssignmentUtils sees them as “someone with bricks”
        // This ensures the green “Selling a BRICK\nPay me $10!” text & ability to build
        if (!this.world.hasComponent(agentId, 'Supply')) {
          this.world.addComponent(agentId, 'Supply', {
            good: Goods.BRICK,
            reservationPrice: 10, // typical for your building cost logic
            quantity: 999
          });
        }
  
        // 4) Rename them "Worker" or something consistent
        const nameComp = this.world.getComponent(agentId, 'Name');
        if (nameComp) {
          nameComp.firstName = 'Worker';
        } else {
          this.world.addComponent(agentId, 'Name', { firstName: 'Worker' });
        }
      }
  
      // Hide bubble after 5 seconds
      setTimeout(() => {
        speechBubble.visible = false;
      }, 5000);
    }, 2000);
  
    // Keep a reference if you want
    this.world.apartmentWorker = agentId;
  }

  drawPreview(mouseX, mouseY, scaleFactor, playerEntity, world, selectedCard) {
    const playerPos = world.getComponent(playerEntity, 'Position');
    if (!playerPos) return;
    const worldX = (mouseX - width / 2) / scaleFactor + playerPos.x;
    const worldY = (mouseY - height / 2) / scaleFactor + playerPos.y;

    push();
    noStroke();
    fill(255, 255, 255, 150);
    const col = Math.floor(worldX / tileSize);
    const row = Math.floor(worldY / tileSize);
    rect(col * tileSize, row * tileSize, tileSize, tileSize);
    pop();
  }
}
