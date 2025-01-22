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

/**
 * A small helper used for incrementing price by +5, +10, or +50
 * depending on how many we've placed so far.
 */
function getNextPriceIncrement(countSoFar) {
  if (countSoFar <= 4) return 5;
  else if (countSoFar <= 7) return 10;
  else return 50;
}

/**
 * Example formula for rods: start from 8, then for i=1..nthRod,
 * add getNextPriceIncrement(i).
 */
function computeRodPrice(n) {
  let price = 8;
  for (let i = 1; i <= n; i++) {
    price += getNextPriceIncrement(i);
  }
  return price;
}

/** Example formula for lockers: can be changed if you want different logic. */
function computeLockerPrice(n) {
  let price = 8;
  for (let i = 1; i <= n; i++) {
    price += getNextPriceIncrement(i);
  }
  return price;
}

/** Example formula for iceboxes: can be changed if you want different logic. */
function computeIceboxPrice(n) {
  let price = 8;
  for (let i = 1; i <= n; i++) {
    price += getNextPriceIncrement(i);
  }
  return price;
}

export class BuildingSystem {
  constructor(world) {
    this.world = world;
    this.lastTilePlaced = { row: null, col: null };
    this.isDraggingLeft = false;
    this.promptActive = false;
    this.pendingGridTasks = [];

    // Decor items that make fish consumers pay more if placed on "reception_floor"
    this.receptionDecor = new Set(['pottedplant', 'stools']);

    // Staff amenities that lower staff wages if placed anywhere
    this.staffAmenities = new Set([
      'pottedplant',       
      'staffroom_floor',
      'coffeemachine',
      'waterdispenser',
      'stools',
      'table',
      'tv',
      'bathroom_floor',
      'toilet',
      'sink'
    ]);
  }

  stopDrag() {
    this.isDraggingLeft = false;
  }

  handleMousePressed(btn, mx, my, sf, playerEntity, world, selCard) {
    const pp = world.getComponent(playerEntity, 'Position');
    if (!pp || !selCard) return;
    const wx = (mx - width / 2) / sf + pp.x;
    const wy = (my - height / 2) / sf + pp.y;

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
    // 1) If there's a forest => remove tree
    if (tileMap[r][c].type === 'forest') {
      tileMap[r][c].hasTree = false;
    }

    // 2) If placing a key => check constraints
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
        console.log("This region already has a key; ignoring second key");
        return;
      }
    }

    // 3) Remember old tile type (to see if it was 'reception_floor')
    const oldTileType = tileMap[r][c].type;

    // 4) Mark as blueprint
    tileMap[r][c] = {
      type: t,
      hasTree: false,
      regenTime: 0,
      transparent: true,
      claimed: -1,
      inventory: InventoryComponent(),
    };

    // 5) Enqueue new building tasks
    if (!this.world.placedBuildingsForAssignmentQueue) {
      this.world.placedBuildingsForAssignmentQueue = [];
    }
    if (!this.world.placedBuildingsForCostQueue) {
      this.world.placedBuildingsForCostQueue = [];
    }
    const newTask = { type: t, row: r, col: c };
    this.world.placedBuildingsForAssignmentQueue.push(newTask);
    this.world.placedBuildingsForCostQueue.push(newTask);

    // *** PART A: Reception Decor => Fish consumers pay more ($5) ***
    const isDecorItem = this.receptionDecor.has(t);
    const wasReceptionFloor = (oldTileType === 'reception_floor');
    if (isDecorItem && wasReceptionFloor) {
      this.increaseAllFishDemandPrices();
    }

    // *** PART B: Staff Amenities => staff wages go down ($2, min $3) ***
    if (this.staffAmenities.has(t)) {
      this.reduceStaffWages();
    }

    // 6) Attempt to commandeer a worker for construction
    let commandeeredWorker = tryCommandeeringWorker(this.world, t, r, c);
    const acceptablePrice = 10;
    if (!commandeeredWorker) {
      const supplyAgents = this.world.getEntitiesByComponents(['Supply','Position']);
      let overDemandWorker = null;
      for (let agentId of supplyAgents) {
        const supply = this.world.getComponent(agentId, 'Supply');
        if (supply && supply.reservationPrice > acceptablePrice && supply.good === Goods.BRICK) {
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

    // 7) If 'key', spawn that special worker
    if (t === 'key') {
      this.spawnKeyWorker(c * tileSize + tileSize / 2, r * tileSize + tileSize / 2);
    }

    // 8) Teleport all free workers around the blueprint in a ring
    const blueprintX = c * tileSize + tileSize / 2;
    const blueprintY = r * tileSize + tileSize / 2;
    const allWorkers = this.world.getEntitiesByComponents(['Worker','Position','Velocity']);
    const freeWorkers = allWorkers.filter(
      wId => !this.world.hasComponent(wId, 'ConstructionTask')
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
        // Teleport them
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

  /**
   * increaseAllFishDemandPrices()
   *  - Loops over all fish-demanding entities (Demand with good=FISH)
   *  - Increases reservationPrice by $5
   */
  increaseAllFishDemandPrices() {
    const demandEntities = this.world.getEntitiesWith('Demand');
    for (const entId of demandEntities) {
      const dem = this.world.getComponent(entId, 'Demand');
      if (!dem) continue;
      if (dem.good === Goods.FISH) {
        dem.reservationPrice += 5;
        console.log(`Reception decor => Fish demand up for entity ${entId} => $${dem.reservationPrice}`);
      }
    }
  }

  /**
   * reduceStaffWages()
   *   - Loops over all "staff" supply (good in [FISH, FISH_WORK, ASSISTANT_WORK])
   *   - Reduces reservationPrice by $2, min $3
   */
  reduceStaffWages() {
    const supplyEntities = this.world.getEntitiesWith('Supply');
    for (const eId of supplyEntities) {
      const supplyComp = this.world.getComponent(eId, 'Supply');
      if (!supplyComp) continue;

      // e.g. fish sellers = FISH, fishermen = FISH_WORK, assistants = ASSISTANT_WORK
      if (
        supplyComp.good === Goods.FISH ||
        supplyComp.good === Goods.FISH_WORK ||
        supplyComp.good === Goods.ASSISTANT_WORK
      ) {
        // reduce by $2 but not below $3
        supplyComp.reservationPrice = Math.max(3, supplyComp.reservationPrice - 2);
        console.log(`Staff amenity => Lowered wage for entity ${eId} => $${supplyComp.reservationPrice}`);
      }
    }
  }

  removeGridBuilding(r, c) {
    const tile = tileMap[r][c];
  
    // 1) If someone “owned” this tile (the 'claimed' entity), remove their Supply/Demand
    const occupantId = tile.claimed;
    if (occupantId !== undefined && occupantId !== -1) {
      if (this.world.hasComponent(occupantId, 'Supply')) {
        this.world.removeComponent(occupantId, 'Supply');
      }
      if (this.world.hasComponent(occupantId, 'Demand')) {
        this.world.removeComponent(occupantId, 'Demand');
      }
    }
  
    // 2) If this tile had lockedDemand, remove that too
    if (tile.lockedDemand) {
      const lockedConsumerId = tile.lockedDemand;
      if (this.world.hasComponent(lockedConsumerId, 'Demand')) {
        this.world.removeComponent(lockedConsumerId, 'Demand');
      }
      tile.lockedDemand = null;
    }
  
    // 3) Decrement the correct counter depending on tile type
    if (tile.type === 'fishingrod') {
      this.world.numFishingRodsCurrent = Math.max(0, this.world.numFishingRodsCurrent - 1);
    } else if (tile.type === 'locker') {
      this.world.numLockersCurrent = Math.max(0, this.world.numLockersCurrent - 1);
    } else if (tile.type === 'icebox') {
      this.world.numIceboxesCurrent = Math.max(0, this.world.numIceboxesCurrent - 1);
    }

    // 4) After removing occupant => reassign prices for that type so no duplicates
    if (tile.type === 'fishingrod') {
      this.reassignPricesForType('fishingrod');
    } else if (tile.type === 'locker') {
      this.reassignPricesForType('locker');
    } else if (tile.type === 'icebox') {
      this.reassignPricesForType('icebox');
    }
  
    // 5) Reset tile => grassland
    tileMap[r][c] = {
      type: 'grassland',
      hasTree: false,
      regenTime: 0,
      claimed: -1,
      lockedDemand: null,
      inventory: null
    };
  }

  /**
   * Reassign the prices for all occupant buildings of a given tile type.
   * e.g. if 'fishingrod', we reassign for all who have supply.good = FISH_WORK.
   * We gather them in ascending creationOrder (if you choose to store it),
   * or we simply sort by their entity ID if you prefer a different approach.
   */
  reassignPricesForType(buildingType) {
    let targetGood;
    if (buildingType === 'fishingrod') {
      targetGood = Goods.FISH_WORK;
    } else if (buildingType === 'locker') {
      targetGood = Goods.FISH;
    } else if (buildingType === 'icebox') {
      targetGood = Goods.ASSISTANT_WORK;
    } else {
      return; // we don't handle other types here
    }

    // 1) Gather all occupant IDs that have supply with targetGood
    const allSupplyEnts = this.world.getEntitiesWith('Supply');
    let matching = [];
    for (let entId of allSupplyEnts) {
      const supply = this.world.getComponent(entId, 'Supply');
      if (!supply) continue;
      if (supply.good === targetGood) {
        matching.push(entId);
      }
    }

    // 2) Sort them by "creationOrder" if you store it. 
    // If you haven't been storing creationOrder, you could 
    // sort by entity ID or remove logic. 
    matching.sort((a, b) => {
      const sa = this.world.getComponent(a, 'Supply');
      const sb = this.world.getComponent(b, 'Supply');
      // if you stored supply.creationOrder => compare that, else fallback
      let ca = (sa && sa.creationOrder) ? sa.creationOrder : a;
      let cb = (sb && sb.creationOrder) ? sb.creationOrder : b;
      return ca - cb;
    });

    // 3) Now reassign each occupant's price by index
    for (let i = 0; i < matching.length; i++) {
      const occupantId = matching[i];
      const supply = this.world.getComponent(occupantId, 'Supply');
      const nth = i + 1; // the 1-based index in the sorted list

      if (buildingType === 'fishingrod') {
        supply.reservationPrice = computeRodPrice(nth);
      } else if (buildingType === 'locker') {
        supply.reservationPrice = computeLockerPrice(nth);
      } else if (buildingType === 'icebox') {
        supply.reservationPrice = computeIceboxPrice(nth);
      }
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
    } else {
      this.world.addComponent(agentId, 'Position', { x: spawnX, y: spawnY });
    }
    if (!this.world.hasComponent(agentId, 'Velocity')) {
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

      // If bed is found => convert them to a real building worker
      if (hasBed) {
        // Switch visuals from red => normal worker style
        if (rend) {
          rend.helmet = true;   
          rend.helmetColor = null; 
          rend.color = '#E3E763'; 
        }

        // Add a Worker component
        if (!this.world.hasComponent(agentId, 'Worker')) {
          this.world.addComponent(agentId, 'Worker', { expectedWage: 8 });
        }

        // Add a Supply component for bricks
        if (!this.world.hasComponent(agentId, 'Supply')) {
          this.world.addComponent(agentId, 'Supply', {
            good: Goods.BRICK,
            reservationPrice: 10,
            quantity: 999
          });
        }

        // Rename them "Worker"
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

    // Optionally store a reference
    this.world.apartmentWorker = agentId;
  }

  findAnyBuiltBed() {
    // If you have logic that scans for an actual built bed somewhere
    // ... implement it here ...
    return false;
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
