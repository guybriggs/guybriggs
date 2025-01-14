// modules/systems/BuildingSystem.js
import { tileSize, tileMap, mapCols, mapRows } from '../tile/TileMap.js';
import { WorkerSpawner } from './WorkerSpawner.js';
import { createAgent } from '../factories/AgentFactory.js';
import { BehaviorTypes } from '../components/Behavior.js';
import { EmotionTypes } from '../components/Emotion.js';
import { isInFullyEnclosedRegion, getHouseWalls } from '../utils/EnvironmentUtils.js';

export class BuildingSystem {
  constructor(world) {
    this.world = world;
    this.nonGridBuildings = [];
    this.lastTilePlaced = { row: null, col: null };
    this.lastNonGridPos = { x: null, y: null };
    this.isDraggingLeft = false;
  }

  stopDrag() {
    this.isDraggingLeft = false;
  }

  handleMousePressed(btn, mx, my, sf, plyEnt, wld, selCard) {
    const pp = wld.getComponent(plyEnt, 'Position');
    if (!pp || !selCard) return;
    const wx = (mx - width / 2) / sf + pp.x;
    const wy = (my - height / 2) / sf + pp.y;
  
    // Non-grid: table, bed
    if (['table', 'bed'].includes(selCard)) {
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
      } else if (mouseButton === RIGHT) {
        //this.removeSupplierAt(worldX, worldY);
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
  
    // Grid-based
    const c = Math.floor(wx / tileSize);
    const r = Math.floor(wy / tileSize);
    if (c < 0 || r < 0 || c >= mapCols || r >= mapRows) return;
  
    // Prevent duplicate placements during drag
    if (this.lastTilePlaced.row === r && this.lastTilePlaced.col === c) {
      return;
    }
  
    if (mouseButton === LEFT) {
      this.placeGridBuilding(r, c, selCard);
      this.lastTilePlaced = { row: r, col: c };
    } else if (mouseButton === RIGHT) {
      this.removeGridBuilding(r, c);
      this.lastTilePlaced = { row: r, col: c };
    }
  }
  
  placeGridBuilding(r, c, t) {
    // Check if the cell already has a building
    if (tileMap[r][c].type !== 'grassland' && tileMap[r][c].type !== 'dark_floor') {
      return; // Building already exists here
    }
  
    let mt = (t === 'floor') ? 'dark_floor' : (t === 'door') ? 'door_tile' : 'white_bricks';
    tileMap[r][c] = { type: mt, hasTree: false, regenTime: 0, transparent: true };
    if (!this.world.placedBuildingsQueue) this.world.placedBuildingsQueue = [];
    this.world.placedBuildingsQueue.push({ type: t, row: r, col: c });
    WorkerSpawner.spawnGridWorker(this.world, r, c, t, tileSize);
  }  

  placeGridBuilding(r, c, t) {
    let mt = (t === 'floor') ? 'dark_floor' : (t === 'door') ? 'door_tile' : 'white_bricks';
    tileMap[r][c] = { type: mt, hasTree: false, regenTime: 0, transparent: true };
    if (!this.world.placedBuildingsQueue) this.world.placedBuildingsQueue = [];
    this.world.placedBuildingsQueue.push({ type: t, row: r, col: c });
    WorkerSpawner.spawnGridWorker(this.world, r, c, t, tileSize);
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
    const wage = 10;
    this.world.addComponent(entityId, 'FishingRod', { wage, location: { x, y } });
  
    this.nonGridBuildings.push({
      x: x - 20, 
      y: y - 15, 
      w: 40, 
      h: 30, 
      color: 'peru', 
      type: 'fishingrod', 
      entityId
    });
  }
  
  // Inside placeCrate method
  placeCrate(x, y) {
    const entityId = this.world.createEntity();
    // Use larger dimensions and beige color
    const width = 40, height = 30;
    this.world.addComponent(entityId, 'Position', { x, y });
    this.world.addComponent(entityId, 'Renderable', { width, height, color: '#F5F5DC' }); // beige
    this.world.addComponent(entityId, 'Storage', { items: {} });
    
    this.nonGridBuildings.push({
      x: x - width/2,
      y: y - height/2,
      w: width,
      h: height,
      color: '#F5F5DC', // beige
      type: 'crate',
      entityId
    });
  }


  // Original fallback
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
    this.world.addComponent(entityId, 'Renderable', { width: 40, height: 30, color: 'grey' });
    this.world.addComponent(entityId, 'Name', { name: 'Cash Register' });
    return { entityId, x, y, w: 40, h: 30, color: 'grey' };
  }

  placeNonGridBuilding(x, y, t) {
    let w = 30, h = 30, col = '#d2a679';
    if (t === 'table') { w = 40; h = 40; col = '#d9a774'; }
    else if (t === 'bed') { w = 35; h = 50; col = '#6eb5ff'; }

    const building = { x: x - w/2, y: y - h/2, w, h, color: col, type: t, transparent: true };
    const buildingIndex = this.nonGridBuildings.length;
    this.nonGridBuildings.push(building);

    if (!this.world.placedBuildingsQueue) this.world.placedBuildingsQueue = [];
    this.world.placedBuildingsQueue.push({ type: t, x, y });

    // Spawn worker
    const sd = 32 * (5 + Math.random() * 5), ang = Math.random() * TWO_PI;
    const sx = x + Math.cos(ang) * sd, sy = y + Math.sin(ang) * sd;
    const wkr = createAgent(this.world, { behavior: BehaviorTypes.WANDER, emotion: EmotionTypes.NEUTRAL });
    const pos = this.world.getComponent(wkr, 'Position');
    if (pos) { pos.x = sx; pos.y = sy; }
    const rend = this.world.getComponent(wkr, 'Renderable');
    if (rend) rend.helmet = true;
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
  }

  removeNonGridAt(x, y) {
    const idx = this.nonGridBuildings.findIndex(b => x>=b.x && x<(b.x+b.w)&& y>=b.y && y<(b.y+b.h));
    if (idx !== -1) this.nonGridBuildings.splice(idx, 1);
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
        // Draw a simple fishing rod
        // Determine rod base and length
        let rodX = b.x + b.w / 2;
        let rodY = b.y + b.h;      // Start drawing from bottom center of building area
        let rodLength = b.h;       // Use height as rod length

        p5.stroke(139, 69, 19);  // Brown color for rod
        //p5.strokeWeight(3);
        p5.line(rodX, rodY, rodX + rodLength/2, rodY - rodLength);
        
        p5.stroke(192, 192, 192);    // Silver color for line
        p5.line(rodX + rodLength/2, rodY, rodX + rodLength/2, rodY - rodLength);
      }

      if (b.type === 'crate') {
        p5.push();
        // Draw a larger beige crate
        p5.fill(b.color);
        p5.rect(b.x, b.y, b.w, b.h);
        p5.stroke(0);
        p5.line(b.x, b.y, b.x + b.w, b.y + b.h);
        p5.line(b.x + b.w, b.y, b.x, b.y + b.h);
        
        // Optionally display stored goods if needed
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
