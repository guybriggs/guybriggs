// modules/systems/BuildingSystem.js

import { tileSize, tileMap, mapCols, mapRows } from '../tile/TileMap.js';
import { createAgent } from '../factories/AgentFactory.js';
import { EmotionTypes } from '../components/Emotion.js';
import { isInFullyEnclosedRegion, getHouseWalls } from '../utils/EnvironmentUtils.js';
import { Goods } from '../data/Goods.js';
import { tryCommandeeringWorker } from '../utils/WorkerAssignmentUtils.js';
import { typewriteLine } from '../logic/BubbleLogic.js';
import { gatherEnclosedCells, alreadyHasKeyInRegion } from '../utils/BFSUtils.js';

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

  handleMousePressed(btn, mx, my, sf, playerEntity, world, selCard) {
    const pp = world.getComponent(playerEntity, 'Position');
    if (!pp || !selCard) return;
    const wx = (mx - width / 2) / sf + pp.x;
    const wy = (my - height / 2) / sf + pp.y;

    // If user is placing a "supplier", "crate", or "fishingrod", handle separately:
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
    // Only place on grassland or dark_floor
    if (tileMap[r][c].type !== 'grassland' && tileMap[r][c].type !== 'dark_floor') {
      return;
    }

    if (t === 'key') {
      const tileHere = tileMap[r][c];
      // Must be dark_floor to place a key
      if (tileHere.type !== 'dark_floor') {
        console.log("Can't place a key unless it's on dark_floor");
        return;
      }
      // BFS => if not enclosed, return
      const enclosed = gatherEnclosedCells(c, r);
      if (!enclosed) {
        console.log("This floor is not enclosed => can't place key");
        return;
      }
      // Check if that region already has 'key_tile'
      if (alreadyHasKeyInRegion(c, r)) {
        console.log("This region already has a key, ignoring second key");
        return;
      }
    }

    // Decide which tile type to assign
    let tileType;
    switch (t) {
      case 'floor':
        tileType = 'dark_floor';
        break;
      case 'door':
        tileType = 'door_tile';
        break;
      case 'bed':
        tileType = 'bed_tile';
        break;
      case 'table':
        tileType = 'table_tile';   // NEW
        break;
      case 'key':
        tileType = 'key_tile';     // NEW
        break;
      default:
        tileType = 'white_bricks'; // walls, or any fallback
        break;
    }

    // Mark this tile as transparent (blueprint) until fully built
    tileMap[r][c] = {
      type: tileType,
      hasTree: false,
      regenTime: 0,
      transparent: true
    };

    // Enqueue for assignment & cost
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
      // Worker demands better wages
      const supplyAgents = this.world.getEntitiesByComponents(['Supply', 'Position']);
      let overDemandWorker = null;
      for (let agentId of supplyAgents) {
        const supply = this.world.getComponent(agentId, 'Supply');
        if (supply && supply.reservationPrice > acceptablePrice) {
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

    // If we placed a "key", optionally spawn the red-helmet agent
    if (t === 'key') {
      this.spawnKeyWorker(c * tileSize + tileSize / 2, r * tileSize + tileSize / 2);
    }
  }

  removeGridBuilding(r, c) {
    tileMap[r][c] = {
      type: 'grassland',
      hasTree: false,
      regenTime: 0
    };
  }

  placeSupplier(x, y) {
    const cashRegister = this.createCashRegisterEntity(x, y);
    this.nonGridBuildings.push({
      x: x - cashRegister.w / 2,
      y: y - cashRegister.h / 2,
      w: cashRegister.w,
      h: cashRegister.h,
      color: cashRegister.color,
      type: 'cash_register',
      entityId: cashRegister.entityId
    });

    if (isInFullyEnclosedRegion({ x, y })) {
      const wallTiles = getHouseWalls({ x, y });
      wallTiles.forEach((tilePos) => {
        const tile = tileMap[tilePos.gy][tilePos.gx];
        if (tile.type === 'white_bricks') {
          tile.type = 'stone_bricks';
        }
      });
    }

    const fishingRods = this.world.getEntitiesByComponents([
      'FishingRod',
      'Position'
    ]);
    let nearestRod = null;
    let minDistRod = Infinity;
    fishingRods.forEach((rodId) => {
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

    if (nearestRod && minDistRod <= 200) {
      const workers = this.world.getEntitiesByComponents(['Worker', 'Position']);
      let nearestWorker = null;
      let minDistWorker = Infinity;
      workers.forEach((workerId) => {
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

      if (nearestWorker && !this.world.hasComponent(nearestWorker, 'Supply')) {
        this.world.addComponent(nearestWorker, 'Supply', {
          good: Goods.FISH,
          quantity: 50
        });
        console.log(
          `Worker ${nearestWorker} has been assigned as a supplier for fish.`
        );
      }
    }
  }

  createCashRegisterEntity(x, y) {
    const entityId = this.world.createEntity();
    this.world.addComponent(entityId, 'Position', { x, y });
    this.world.addComponent(entityId, 'Renderable', {
      width: 40,
      height: 30,
      color: 'grey'
    });
    this.world.addComponent(entityId, 'Name', { name: 'Cash Register' });
    return { entityId, x, y, w: 40, h: 30, color: 'grey' };
  }

  placeFishingRod(x, y) {
    const entityId = this.world.createEntity();
    this.world.addComponent(entityId, 'Position', { x, y });
    this.world.addComponent(entityId, 'Renderable', {
      width: 40,
      height: 30,
      color: 'blue'
    });
    const defaultWage = 10;
    this.world.addComponent(entityId, 'FishingRod', {
      wage: defaultWage,
      location: { x, y },
      assigned: false
    });

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
    if (!pp) return null;
    const worldX = (mx - width / 2) / sf + pp.x;
    const worldY = (my - height / 2) / sf + pp.y;
    for (let b of this.nonGridBuildings) {
      if (
        b.type === 'fishingrod' &&
        worldX >= b.x &&
        worldX < b.x + b.w &&
        worldY >= b.y &&
        worldY < b.y + b.h
      ) {
        return b;
      }
    }
    return null;
  }

  promptWageChange(rod) {
    const currentWage = rod.wage || 10;
    const newWageStr = 10;
    if (newWageStr !== null) {
      const newWage = parseFloat(newWageStr);
      if (!isNaN(newWage)) {
        const rodEntityId = rod.entityId;
        const fishingRodComp = this.world.getComponent(rodEntityId, 'FishingRod');
        if (fishingRodComp) {
          fishingRodComp.wage = newWage;
        }
        rod.wage = newWage;
      }
    }

    // Clear selection to avoid unintended placements
    if (typeof cardSystem !== 'undefined') {
      cardSystem.selectedCardType = null;
    }
  }

  placeCrate(x, y) {
    const entityId = this.world.createEntity();
    const width = 40,
      height = 30;
    this.world.addComponent(entityId, 'Position', { x, y });
    this.world.addComponent(entityId, 'Renderable', {
      width,
      height,
      color: '#F5F5DC'
    });
    this.world.addComponent(entityId, 'Storage', { items: {} });

    this.nonGridBuildings.push({
      x: x - width / 2,
      y: y - height / 2,
      w: width,
      h: height,
      color: '#F5F5DC',
      type: 'crate',
      entityId
    });
  }

  // CHANGED: No bed logic here—only table/key remain in non-grid.
  placeNonGridBuilding(x, y, t) {
    let w = 30,
      h = 30,
      col = '#d2a679';
    if (t === 'table') {
      w = 40;
      h = 40;
      col = '#d9a774';
    } else if (t === 'key') {
      w = 20;
      h = 30;
      col = '#fada5e';
    }

    const building = {
      x: x - w / 2,
      y: y - h / 2,
      w,
      h,
      color: col,
      type: t,
      transparent: true
    };
    const buildingIndex = this.nonGridBuildings.length;
    this.nonGridBuildings.push(building);

    if (!this.world.placedBuildingsQueue) this.world.placedBuildingsQueue = [];
    this.world.placedBuildingsQueue.push({ type: t, x, y });

    // Spawn a worker for table/key construction
    const sd = 32 * (5 + Math.random() * 5);
    const ang = Math.random() * TWO_PI;
    const sx = x + Math.cos(ang) * sd;
    const sy = y + Math.sin(ang) * sd;
    const wkr = createAgent(this.world, {
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

    if (t === 'key') {
      this.spawnKeyWorker(x, y);
    }
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

  removeNonGridAt(x, y) {
    const idx = this.nonGridBuildings.findIndex(
      (b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h
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

    // CHANGED: bed is now a grid tile.
    // So the preview for bed is just like wall/floor/door—show the tile highlight.
    if (
      selectedCard === 'wall' ||
      selectedCard === 'floor' ||
      selectedCard === 'door' ||
      selectedCard === 'bed'
    ) {
      const col = Math.floor(worldX / tileSize);
      const row = Math.floor(worldY / tileSize);
      rect(col * tileSize, row * tileSize, tileSize, tileSize);
    } else if (selectedCard === 'table' || selectedCard === 'key') {
      let w = selectedCard === 'table' ? 40 : 20;
      let h = selectedCard === 'table' ? 40 : 30;
      rect(worldX - w / 2, worldY - h / 2, w, h);
    } else {
      // default fallback for other building types
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

  // This function used to check for bed in non-grid; now you could:
  checkForBed(pos) {
    // If you want to see if there's a bed_tile at a given row/col:
    const gx = Math.floor(pos.x / tileSize);
    const gy = Math.floor(pos.y / tileSize);
    if (
      gx < 0 ||
      gy < 0 ||
      gx >= mapCols ||
      gy >= mapRows ||
      !tileMap[gy] ||
      !tileMap[gy][gx]
    ) {
      return false;
    }
    return tileMap[gy][gx].type === 'bed_tile';
  }

  findAnyBuiltBed() {
    for (let r = 0; r < mapRows; r++) {
      for (let c = 0; c < mapCols; c++) {
        const tile = tileMap[r][c];
        // If we find a bed_tile that's no longer transparent => fully built bed
        if (tile.type === 'bed_tile' && tile.transparent === false) {
          return true;
        }
      }
    }
    return false;
  }

  updateDraw(p5) {
    // We only render nonGridBuildings in here
    // bed_tile is part of tileMap, drawn by your TileRenderSystem or similar
    for (let b of this.nonGridBuildings) {
      p5.noStroke();

      if (b.transparent) {
        p5.fill(192);
      } else {
        p5.fill(b.color);
      }

      if (b.type === 'key') {
        p5.push();
        p5.translate(b.x + b.w / 2, b.y + b.h / 2);

        let handleRadius = Math.min(b.w, b.h) / 2;
        p5.ellipseMode(p5.CENTER);
        p5.ellipse(0, 0, handleRadius, handleRadius);

        let shaftLength = b.h / 2;
        let shaftThickness = 2;
        p5.rect(
          handleRadius * 0.5,
          -shaftThickness / 2,
          shaftLength,
          shaftThickness
        );

        let bitWidth = 4,
          bitHeight = 6;
        p5.rect(
          handleRadius * 0.5 + shaftLength,
          -bitHeight / 2,
          bitWidth,
          bitHeight
        );
        p5.pop();
        continue;
      }

      if (b.type === 'redDot') {
        p5.fill('red');
        p5.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h);
        continue;
      }

      if (b.type === 'apartmentLabel') {
        p5.fill(255);
        p5.textAlign(p5.CENTER, p5.BOTTOM);
        p5.text(b.text, b.x + b.w / 2, b.y + b.h);
        continue;
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
        p5.line(rodX, rodY, rodX + rodLength / 2, rodY - rodLength);

        p5.stroke(192, 192, 192);
        p5.line(rodX + rodLength / 2, rodY, rodX + rodLength / 2, rodY - rodLength);

        p5.fill(0);
        p5.noStroke();
        p5.textAlign(p5.CENTER, p5.BOTTOM);
        p5.textSize(12);
        p5.text(`$${b.wage}`, b.x + b.w / 2, b.y - 5);

        const fr = this.world.getComponent(b.entityId, 'FishingRod');
        const fr_txt = fr.assigned ? 'Assigned' : 'Unassigned';
        p5.text(`${fr_txt}`, b.x + b.w / 2, b.y - 20);
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
