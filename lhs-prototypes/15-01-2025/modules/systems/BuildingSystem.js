// modules/systems/BuildingSystem.js

import { tileSize, tileMap, mapCols, mapRows } from '../tile/TileMap.js';
import { WorkerSpawner } from './WorkerSpawner.js';
import { createAgent } from '../factories/AgentFactory.js';
import { BehaviorTypes } from '../components/Behavior.js';
import { EmotionTypes } from '../components/Emotion.js';
import { isInFullyEnclosedRegion, getHouseWalls } from '../utils/EnvironmentUtils.js';
import { Goods } from '../data/Goods.js';  // Added import for Goods
import { tryCommandeeringWorker } from '../utils/WorkerAssignmentUtils.js';

export class BuildingSystem {
  constructor(world) {
    this.world = world;
    this.nonGridBuildings = [];
    this.lastTilePlaced = { row: null, col: null };
    this.lastNonGridPos = { x: null, y: null };
    this.isDraggingLeft = false;
    this.promptActive = false;
    this.pendingGridTasks = [];
    this.pendingNonGridTasks = [];
  }

  stopDrag() {
    this.isDraggingLeft = false;
  }

  handleMousePressed(btn, mx, my, sf, plyEnt, wld, selCard) {
    const pp = wld.getComponent(plyEnt, 'Position');
    if (!pp || !selCard) return;
    const wx = (mx - width / 2) / sf + pp.x;
    const wy = (my - height / 2) / sf + pp.y;
  
    if (['table', 'bed', 'key'].includes(selCard)) {
      if (btn === LEFT) {
        if (this.lastNonGridPos.x !== null) {
          const dx = wx - this.lastNonGridPos.x, dy = wy - this.lastNonGridPos.y;
          if (dx * dx + dy * dy < 100) return;
        }
        this.placeNonGridBuilding(wx, wy, selCard);
        this.lastNonGridPos = { x: wx, y: wy };
        this.isDraggingLeft = true;
      } else if (btn === RIGHT) {
        this.removeNonGridAt(wx, wy);
      }
      return;
    }
  
    if (selCard === 'supplier') {
      if (mouseButton === LEFT) {
        this.placeSupplier(wx, wy);
      }
      return;
    }
  
    if (selCard === 'crate') {
      if (mouseButton === LEFT) {
        this.placeCrate(wx, wy);
      }
      return;
    }
  
    if (selCard === 'fishingrod') {
      if (mouseButton === LEFT) {
        this.placeFishingRod(wx, wy);
      }
      return;
    }
  
    const c = Math.floor(wx / tileSize);
    const r = Math.floor(wy / tileSize);
    if (c < 0 || r < 0 || c >= mapCols || r >= mapRows) return;
    if (this.lastTilePlaced.row === r && this.lastTilePlaced.col === c) return;
  
    if (mouseButton === LEFT) {
      this.placeGridBuilding(r, c, selCard);
      this.lastTilePlaced = { row: r, col: c };
    } else if (mouseButton === RIGHT) {
      this.removeGridBuilding(r, c);
      this.lastTilePlaced = { row: r, col: c };
    }
  }
  
  placeGridBuilding(r, c, t) {
    if (tileMap[r][c].type !== 'grassland' && tileMap[r][c].type !== 'dark_floor') return;
    let mt = (t === 'floor') ? 'dark_floor' : (t === 'door') ? 'door_tile' : 'white_bricks';
    tileMap[r][c] = { type: mt, hasTree: false, regenTime: 0, transparent: true };

    if (!this.world.placedBuildingsForAssignmentQueue) {
      this.world.placedBuildingsForAssignmentQueue = [];
    }
    if (!this.world.placedBuildingsForCostQueue) {
      this.world.placedBuildingsForCostQueue = [];
    }
    
    // Push the new task to both queues
    const newTask = { type: t, row: r, col: c };
    this.world.placedBuildingsForAssignmentQueue.push(newTask);
    this.world.placedBuildingsForCostQueue.push(newTask);

    const potentialWorkers = this.world.getEntitiesByComponents(['Worker', 'Velocity']);
    const acceptablePrice = 10;
    const supplyAgents = this.world.getEntitiesByComponents(['Supply', 'Position']);

    let commandeeredWorker = tryCommandeeringWorker(this.world, t, r, c);

    if (!commandeeredWorker) {
      let overDemandWorker = null;
      for (let agentId of supplyAgents) {
        const supply = this.world.getComponent(agentId, 'Supply');
        if (supply && supply.reservationPrice > acceptablePrice) {
          overDemandWorker = agentId;
          break;
        }
      }
      if (overDemandWorker) {
        console.log(`Worker ${overDemandWorker} demands better wages.`);
        const pos = this.world.getComponent(overDemandWorker, 'Position');
        if (pos) {
          pos.x = r * tileSize + tileSize / 2;
          pos.y = c * tileSize + tileSize / 2;
        }
        // Set up speech bubble with typewriter effect
        const messages = ["I demand better wages.", "Awful wages.", "Nice blueprint, that I won't build."];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.world.addComponent(overDemandWorker, 'SpeechBubble', {
          textOptions: messages,
          fullText: randomMessage,
          typed: "",
          index: 0,
          visible: true,
          xOffset: 0,
          yOffset: -40,
          bubbleColor: "white",
          textColor: "#ffffff"  // white text
        });
        // Assign goal to move toward the blueprint block
        this.world.addComponent(overDemandWorker, 'GoalPosition', { 
          x: r * tileSize + tileSize / 2, 
          y: c * tileSize + tileSize / 2 
        });
      } else {
        console.log('No available worker with acceptable supply reservation price found for grid building.');
      }
    }
  }
  
  removeGridBuilding(r, c) {
    tileMap[r][c] = { type: 'grassland', hasTree: false, regenTime: 0 };
  }

  placeSupplier(x, y) {
    // 1. Create and store the Cash Register entity
    const cashRegister = this.createCashRegisterEntity(x, y);
    this.nonGridBuildings.push({ 
      x: x - cashRegister.w/2, 
      y: y - cashRegister.h/2, 
      w: cashRegister.w, 
      h: cashRegister.h, 
      color: cashRegister.color, 
      type: 'cash_register', 
      entityId: cashRegister.entityId
    });
 
    // Convert house to stone bricks if inside a fully enclosed region
    const cashRegPos = { x, y };
    if(isInFullyEnclosedRegion(cashRegPos)) {
      const wallTiles = getHouseWalls(cashRegPos);
      wallTiles.forEach(tilePos => {
        const tile = tileMap[tilePos.gy][tilePos.gx];
        if(tile.type === 'white_bricks') {
          tile.type = 'stone_bricks';
        }
      });
    }
 
    // 2. Find the nearest fishing rod within radius 200
    const fishingRods = this.world.getEntitiesByComponents(['FishingRod', 'Position']);
    let nearestRod = null;
    let minDistRod = Infinity;
    fishingRods.forEach(rodId => {
      const rodPos = this.world.getComponent(rodId, 'Position');
      if (!rodPos) return;
      const dx = rodPos.x - x;
      const dy = rodPos.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < minDistRod) {
        minDistRod = dist;
        nearestRod = { id: rodId, pos: rodPos };
      }
    });
 
    // 3. If a fishing rod is found within radius, locate the nearest worker to that rod
    if (nearestRod && minDistRod <= 200) {
      const workers = this.world.getEntitiesByComponents(['Worker', 'Position']);
      let nearestWorker = null;
      let minDistWorker = Infinity;
      workers.forEach(workerId => {
        const workerPos = this.world.getComponent(workerId, 'Position');
        if (!workerPos) return;
        const dx = workerPos.x - nearestRod.pos.x;
        const dy = workerPos.y - nearestRod.pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDistWorker) {
          minDistWorker = dist;
          nearestWorker = workerId;
        }
      });
 
      // 4. Add the Supply component to the nearest worker if not already one
      if (nearestWorker && !this.world.hasComponent(nearestWorker, 'Supply')) {
        this.world.addComponent(nearestWorker, 'Supply', { 
          good: Goods.FISH, 
          quantity: 50 
        });
        console.log(`Worker ${nearestWorker} has been assigned as a supplier.`);
      }
    }
  }
 
  createCashRegisterEntity(x, y) {
    const entityId = this.world.createEntity();
    this.world.addComponent(entityId, 'Position', { x, y });
    this.world.addComponent(entityId, 'Renderable', { width: 40, height: 30, color: 'grey' });
    this.world.addComponent(entityId, 'Name', { name: 'Cash Register' });
    return { entityId, x, y, w: 40, h: 30, color: 'grey' };
  }

  placeFishingRod(x, y) {
    const entityId = this.world.createEntity();
    this.world.addComponent(entityId, 'Position', { x, y });
    this.world.addComponent(entityId, 'Renderable', { width: 40, height: 30, color: 'blue' });
    const defaultWage = 10;
    this.world.addComponent(entityId, 'FishingRod', { wage: defaultWage, location: { x, y }, assigned: false });
  
    const rodBuilding = {
      x: x - 20,
      y: y - 15,
      w: 40,
      h: 30,
      color: 'peru',
      type: 'fishingrod',
      entityId,
      wage: defaultWage
    };
  
    this.nonGridBuildings.push(rodBuilding);
  
    this.promptWageChange(rodBuilding);
  }
  
  getFishingRodAt(mx, my, sf, playerEntity) {
    const pp = this.world.getComponent(playerEntity, 'Position');
    if(!pp) return null;
    const worldX = (mx - width/2) / sf + pp.x;
    const worldY = (my - height/2) / sf + pp.y;
    for(let b of this.nonGridBuildings) {
      if(b.type === 'fishingrod' && worldX >= b.x && worldX < b.x + b.w && worldY >= b.y && worldY < b.y + b.h) {
        return b;
      }
    }
    return null;
  }
  
  promptWageChange(rod) {

    const currentWage = rod.wage || 10;
    const newWageStr = 10;
    if(newWageStr !== null) {
      const newWage = parseFloat(newWageStr);
      if(!isNaN(newWage)) {
        const rodEntityId = rod.entityId;
        const fishingRodComp = this.world.getComponent(rodEntityId, 'FishingRod');
        if(fishingRodComp) {
          fishingRodComp.wage = newWage;
        }
        rod.wage = newWage;
      }
    }

    // Clear selection to avoid unintended placements
    if(typeof cardSystem !== 'undefined') {
      cardSystem.selectedCardType = null;
    }
  }

  placeCrate(x, y) {
    const entityId = this.world.createEntity();
    const width = 40, height = 30;
    this.world.addComponent(entityId, 'Position', { x, y });
    this.world.addComponent(entityId, 'Renderable', { width, height, color: '#F5F5DC' });
    this.world.addComponent(entityId, 'Storage', { items: {} });
    
    this.nonGridBuildings.push({
      x: x - width/2,
      y: y - height/2,
      w: width,
      h: height,
      color: '#F5F5DC',
      type: 'crate',
      entityId
    });
  }


  handleOldLogic(mouseButton, worldX, worldY) {
    const col = Math.floor(worldX / tileSize);
    const row = Math.floor(worldY / tileSize);
    if (col < 0 || row < 0 || col >= mapCols || row >= mapRows) return;
    tileMap[row][col] = {
      type: (mouseButton === LEFT) ? 'white_bricks' : 'grassland',
      hasTree: false,
      regenTime: 0
    };
  }
  
  createCashRegisterEntity(x, y) {
    const entityId = this.world.createEntity();
    this.world.addComponent(entityId, 'Position', { x, y });
    this.world.addComponent(entityId, 'Renderable', {
      width: 40, height: 30, color: 'grey', sprite: null
    });
    this.world.addComponent(entityId, 'Name', { name: 'Cash Register' });
    return { entityId, x, y, w: 40, h: 30, color: 'grey' };
  }

  placeNonGridBuilding(x, y, t) {
    let w = 30, h = 30, col = '#d2a679';
    if (t === 'table') {
      w = 40; h = 40; col = '#d9a774';
    } else if (t === 'bed') {
      w = 35; h = 50; col = '#6eb5ff';
    }
    else if (t === 'key') {
      w = 20; h = 30; col = '#fada5e';
    }
  
    const building = { x: x - w/2, y: y - h/2, w, h, color: col, type: t, transparent: true };
    const buildingIndex = this.nonGridBuildings.length;
    this.nonGridBuildings.push(building);
  
    if (!this.world.placedBuildingsQueue) this.world.placedBuildingsQueue = [];
    this.world.placedBuildingsQueue.push({ type: t, x, y });

    // 1) Always spawn a worker for table/bed/key construction (they will wander):
    const sd = 32 * (5 + Math.random() * 5);
    const ang = Math.random() * TWO_PI;
    const sx = x + Math.cos(ang) * sd;
    const sy = y + Math.sin(ang) * sd;
    const wkr = createAgent(this.world, {
      behavior: BehaviorTypes.WANDER,
      emotion: EmotionTypes.NEUTRAL
    });
    const pos = this.world.getComponent(wkr, 'Position');
    if (pos) {
      pos.x = sx;
      pos.y = sy;
    }
    const rend = this.world.getComponent(wkr, 'Renderable');
    if (rend) {
      rend.helmet = true;
    }
    this.world.addComponent(wkr, 'GoalPosition', { x, y });

    this.world.addComponent(wkr, 'ConstructionTask', {
      isGrid: false,
      buildingIndex,
      targetX: x,
      targetY: y,
      startTime: millis(),
      constructing: false,
      returning: false,
      originX: sx,
      originY: sy,
      type: t
    });

    // 2) If we placed a "key", spawn a separate red-helmet agent 3 tiles away,
    //    but restrict its wander radius so it stays close to the key
    if (t === 'key') {
      this.spawnKeyWorker(x, y);
    }
  }

  // The method for spawning a red-helmet agent 3 tiles away, with a limited wander radius
  spawnKeyWorker(keyX, keyY) {
    // spawn exactly 3 tiles away from (keyX, keyY)
    const dist = tileSize * 3;
    const angle = Math.random() * TWO_PI;
    const spawnX = keyX + Math.cos(angle)*dist;
    const spawnY = keyY + Math.sin(angle)*dist;

    // Create agent with a WANDER behavior, but boundingRadius is smaller
    const agentId = createAgent(this.world, {
      behavior: BehaviorTypes.WANDER,
      behaviorData: {
        // center is the key pos
        boundingCenter: { x: keyX, y: keyY },
        // boundingRadius is small => won't roam too far from the key
        boundingRadius: tileSize * 0.9
      },
      emotion: EmotionTypes.NEUTRAL
    });
    const pos = this.world.getComponent(agentId, 'Position');
    if (pos) {
      pos.x = spawnX;
      pos.y = spawnY;
    }

    // Red helmet + red face
    const rend = this.world.getComponent(agentId, 'Renderable');
    if (rend) {
      rend.helmet = true;
      rend.helmetColor = 'red';
      rend.color = 'red';
    }
  }

  removeNonGridAt(x, y) {
    const idx = this.nonGridBuildings.findIndex(b =>
      x>=b.x && x<(b.x+b.w) && y>=b.y && y<(b.y+b.h)
    );
    if (idx !== -1) this.nonGridBuildings.splice(idx, 1);
  }

  drawPreview(mouseX, mouseY, scaleFactor, playerEntity, world, selectedCard) {
    const playerPos = world.getComponent(playerEntity, 'Position');
    if (!playerPos) return;
    const worldX = (mouseX - width / 2) / scaleFactor + playerPos.x;
    const worldY = (mouseY - height / 2) / scaleFactor + playerPos.y;

    push();
    noStroke();
    fill(255, 255, 255, 150);

    if (selectedCard === 'table' || selectedCard === 'bed') {
      let w = (selectedCard === 'table') ? 40 : 35;
      let h = (selectedCard === 'table') ? 40 : 50;
      rect(worldX - w / 2, worldY - h / 2, w, h);
    } else if (selectedCard === 'wall' || selectedCard === 'floor' || selectedCard === 'door') {
      const col = Math.floor(worldX / tileSize);
      const row = Math.floor(worldY / tileSize);
      rect(col * tileSize, row * tileSize, tileSize, tileSize);
    } else {
      const col = Math.floor(worldX / tileSize);
      const row = Math.floor(worldY / tileSize);
      if (mouseIsPressed) {
        if (mouseButton === LEFT) fill(255, 255, 255, 150);
        else if (mouseButton === RIGHT) fill(34, 139, 34, 150);
      }
      rect(col * tileSize, row * tileSize, tileSize, tileSize);
    }
    pop();
  }

  drawCashRegisterPreview(x, y) {
    push();
    noStroke();
    fill(128, 128, 128, 150);
    rect(x - 20, y - 15, 40, 30, 5);
    pop();
  }

  updateDraw(p5) {
    for (let b of this.nonGridBuildings) {
      p5.noStroke();
  
      // If it's transparent => blueprint grey
      if (b.transparent) {
        p5.fill(192);
      } else {
        p5.fill(b.color);
      }
  
      // For items that are not 'key', do your usual rectangle or shape:
      if (b.type !== 'key') {
        p5.rect(b.x, b.y, b.w, b.h);
        // ... existing table/bed logic ...
        continue;
      }
  
      // If it's 'key', draw a *much smaller* key shape:
      if (b.type === 'key') {
        p5.push();
        p5.translate(b.x + b.w/2, b.y + b.h/2);
  
        let handleRadius = Math.min(b.w, b.h) / 2; 
        p5.ellipseMode(p5.CENTER);
        p5.ellipse(0, 0, handleRadius, handleRadius);
  
        let shaftLength = (b.h / 2); 
        let shaftThickness = 2;
        p5.rect(handleRadius * 0.5, -shaftThickness/2, shaftLength, shaftThickness);

        let bitWidth = 4, bitHeight = 6;
        p5.rect(
          handleRadius * 0.5 + shaftLength, 
          -bitHeight/2, 
          bitWidth, 
          bitHeight
        );
        p5.pop();
      }

      if (b.type === 'redDot') {
        p5.fill('red');
        p5.ellipse(b.x + b.w/2, b.y + b.h/2, b.w, b.h);
      }

      if (b.transparent) {
        let grey;
        if (b.type === 'table') grey = color(211, 211, 211);
        else if (b.type === 'bed') grey = color(192, 192, 192);
        else grey = color(b.color);
        p5.fill(grey);
      } else {
        p5.fill(b.color);
      }
      p5.rect(b.x, b.y, b.w, b.h);
  
      if (b.type === 'cash_register') {
        p5.fill(200);
        p5.rect(b.x + 5, b.y + 5, b.w - 10, b.h - 10);
      }
  
      if (b.type === 'fishingrod') {
        let rodX = b.x + b.w / 2;
        let rodY = b.y + b.h;
        let rodLength = b.h;

        p5.stroke(139, 69, 19);
        p5.line(rodX, rodY, rodX + rodLength/2, rodY - rodLength);
        
        p5.stroke(192, 192, 192);
        p5.line(rodX + rodLength/2, rodY, rodX + rodLength/2, rodY - rodLength);

        p5.fill(0); 
        p5.noStroke();
        p5.textAlign(p5.CENTER, p5.BOTTOM);
        p5.textSize(12);
        p5.text(`$${b.wage}`, b.x + b.w/2, b.y - 5);

        const fr = this.world.getComponent(b.entityId, 'FishingRod');
        const fr_txt = fr.assigned ? 'Assigned' : 'Unassigned';
        p5.text(`${fr_txt}`, b.x + b.w/2, b.y - 20);
      }

      if (b.type === 'crate') {
        p5.push();
        p5.fill(b.color);
        p5.rect(b.x, b.y, b.w, b.h);
        p5.stroke(0);
        p5.line(b.x, b.y, b.x + b.w, b.y + b.h);
        p5.line(b.x + b.w, b.y, b.x, b.y + b.h);
        
        const storage = this.world.getComponent(b.entityId, 'Storage');
        if (storage && Object.keys(storage.items).length > 0) {
          p5.fill(0);
          p5.textAlign(p5.CENTER, p5.CENTER);
          const itemsText = Object.entries(storage.items)
            .map(([item, qty]) => `${item}: ${qty}`)
            .join(', ');
          p5.text(itemsText, b.x + b.w / 2, b.y + b.h / 2);
        }
        
        p5.pop();
      }
    }
  }
}
