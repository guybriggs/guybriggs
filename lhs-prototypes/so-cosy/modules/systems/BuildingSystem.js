// modules/systems/BuildingSystem.js
import { tileSize, tileMap, mapCols, mapRows } from '../tile/TileMap.js';
import { createAgent } from '../factories/AgentFactory.js'; // Import the Supplier Agent factory
import { EmotionTypes } from '../components/Emotion.js'; // Import Emotion Types if needed
import { Goods } from '../data/Goods.js'; // Import Goods for Supply component

export class BuildingSystem {
  constructor(world) {
    this.world = world; // Store the world instance
    this.nonGridBuildings = [];
  }

  handleMousePressed(mouseButton, mouseX, mouseY, scaleFactor, playerEntity, world, selectedCard) {
    const playerPos = world.getComponent(playerEntity, 'Position');
    if (!playerPos) return;

    const worldX = (mouseX - width / 2) / scaleFactor + playerPos.x;
    const worldY = (mouseY - height / 2) / scaleFactor + playerPos.y;

    // If no card is selected, fallback to old logic
    if (!selectedCard) {
      this.handleOldLogic(mouseButton, worldX, worldY);
      return;
    }

    // **Handle Supplier Card**
    if (selectedCard === 'supplier') {
      if (mouseButton === LEFT) {
        this.placeSupplier(worldX, worldY);
      } else if (mouseButton === RIGHT) {
        this.removeSupplierAt(worldX, worldY);
      }
      return;
    }

    // Non-grid items (table, bed)
    if (selectedCard === 'table' || selectedCard === 'bed') {
      if (mouseButton === LEFT) {
        this.placeNonGridBuilding(worldX, worldY, selectedCard);
      } else if (mouseButton === RIGHT) {
        this.removeNonGridAt(worldX, worldY);
      }
      return;
    }

    // Grid-based items (wall, floor, door)
    const col = Math.floor(worldX / tileSize);
    const row = Math.floor(worldY / tileSize);
    if (col < 0 || row < 0 || col >= mapCols || row >= mapRows) return;

    if (mouseButton === LEFT) {
      this.placeGridBuilding(row, col, selectedCard);
    } else if (mouseButton === RIGHT) {
      this.removeGridBuilding(row, col);
    }
  }

  // Original fallback
  handleOldLogic(mouseButton, worldX, worldY) {
    const col = Math.floor(worldX / tileSize);
    const row = Math.floor(worldY / tileSize);
    if (col < 0 || row < 0 || col >= mapCols || row >= mapRows) return;

    if (mouseButton === LEFT) {
      tileMap[row][col] = { type: 'white_bricks', hasTree: false, regenTime: 0 };
    } else if (mouseButton === RIGHT) {
      tileMap[row][col] = { type: 'grassland', hasTree: false, regenTime: 0 };
    }
  }

  placeGridBuilding(row, col, type) {
    let mapType = 'white_bricks'; // default for "wall"
    if (type === 'floor') mapType = 'dark_floor';
    if (type === 'door')  mapType = 'door_tile';

    tileMap[row][col] = {
      type: mapType,
      hasTree: false,
      regenTime: 0
    };
  }

  removeGridBuilding(row, col) {
    tileMap[row][col] = {
      type: 'grassland',
      hasTree: false,
      regenTime: 0
    };
  }

  placeNonGridBuilding(x, y, type) {
    // Make them bigger & more colorful
    let w = 30, h = 30;
    let color = '#d2a679'; // default table color
    if (type === 'table') {
      w = 40;  // bigger table
      h = 40;
      color = '#d9a774'; 
    } else if (type === 'bed') {
      w = 35;  // bigger bed
      h = 50;
      color = '#6eb5ff'; // bright-ish blue
    }

    this.nonGridBuildings.push({ x: x - w/2, y: y - h/2, w, h, color, type });
  }

  removeNonGridAt(x, y) {
    const idx = this.nonGridBuildings.findIndex(b =>
      x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h
    );
    if (idx !== -1) {
      this.nonGridBuildings.splice(idx, 1);
    }
  }

  // **New Method: Place Supplier**
  placeSupplier(x, y) {
    // **1. Spawn the Cash Register as a Non-Grid Building**
    const cashRegister = this.createCashRegisterEntity(x, y);

    // **2. Spawn the Supplier Agent with Supply Component**
    const supplierX = x + 50; // Adjust offset as needed
    const supplierY = y;       // Adjust offset as needed

    const supplierAgent = this.createSupplierAgentEntity(supplierX, supplierY);

    // **3. Store the Cash Register and Supplier Agent (Optional)**
    // This can be useful for management or future features
    this.nonGridBuildings.push({ 
      x: x - cashRegister.w / 2, 
      y: y - cashRegister.h / 2, 
      w: cashRegister.w, 
      h: cashRegister.h, 
      color: cashRegister.color, 
      type: 'cash_register', 
      entityId: cashRegister.entityId,
      supplierAgentId: supplierAgent
    });

    console.log('Supplier placed with Cash Register and Supplier Agent.');
  }

  // **New Method: Remove Supplier**
  removeSupplierAt(x, y) {
    // Find the cash register at the position
    const idx = this.nonGridBuildings.findIndex(b =>
      x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h && b.type === 'cash_register'
    );

    if (idx !== -1) {
      const building = this.nonGridBuildings[idx];

      // Remove the Cash Register entity
      if (building.entityId) {
        this.world.entities.delete(building.entityId);
        // Remove all components associated with the Cash Register
        for (let [compName, compStore] of this.world.components) {
          compStore.delete(building.entityId);
        }
      }

      // Remove the Supplier Agent entity
      if (building.supplierAgentId) {
        this.world.entities.delete(building.supplierAgentId);
        // Remove all components associated with the Supplier Agent
        for (let [compName, compStore] of this.world.components) {
          compStore.delete(building.supplierAgentId);
        }
      }

      // Remove from nonGridBuildings
      this.nonGridBuildings.splice(idx, 1);

      console.log('Supplier and Cash Register removed.');
    }
  }

  // **Helper Method: Create Cash Register Entity**
  createCashRegisterEntity(x, y) {
    const entityId = this.world.createEntity();

    // Position Component
    this.world.addComponent(entityId, 'Position', { x, y });

    // Renderable Component
    this.world.addComponent(entityId, 'Renderable', { 
      width: 40, 
      height: 30, 
      color: 'grey', 
      sprite: null // Placeholder for sprite if needed
    });

    // Name Component
    this.world.addComponent(entityId, 'Name', { name: 'Cash Register' });

    // Additional Components if needed (e.g., Interactable)

    return { entityId, x, y, w: 40, h: 30, color: 'grey' };
  }

  // **Helper Method: Create Supplier Agent Entity**
  createSupplierAgentEntity(x, y) {
    const entityId = this.world.createEntity();

    // Position Component
    this.world.addComponent(entityId, 'Position', { x, y });

    // Velocity Component
    this.world.addComponent(entityId, 'Velocity', { vx: 0, vy: 0 });

    // Renderable Component
    this.world.addComponent(entityId, 'Renderable', { radius: 10, color: 'green' });

    // Name Component
    this.world.addComponent(entityId, 'Name', { name: 'Supplier' });

    // Emotion Component (Optional)
    this.world.addComponent(entityId, 'Emotion', { type: EmotionTypes.NEUTRAL });

    // Supply Component
    this.world.addComponent(entityId, 'Supply', { 
      good: Goods.FISH, // Example good
      quantity: 50       // Example quantity
    });

    // Behavior Component (Optional)
    this.world.addComponent(entityId, 'Behavior', { type: 'idle' }); // Define appropriate behavior

    return entityId;
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
      // Show bigger rectangles
      let w = (selectedCard === 'table') ? 40 : 35;
      let h = (selectedCard === 'table') ? 40 : 50;
      rect(worldX - w/2, worldY - h/2, w, h);
    } else if (selectedCard === 'supplier') {
      // Show Cash Register preview
      this.drawCashRegisterPreview(worldX, worldY);
    } else if (selectedCard === 'wall' || selectedCard === 'floor' || selectedCard === 'door') {
      const col = Math.floor(worldX / tileSize);
      const row = Math.floor(worldY / tileSize);
      rect(col * tileSize, row * tileSize, tileSize, tileSize);
    } else {
      // fallback
      const col = Math.floor(worldX / tileSize);
      const row = Math.floor(worldY / tileSize);
      if (mouseIsPressed) {
        if (mouseButton === LEFT) {
          fill(255, 255, 255, 150);
        } else if (mouseButton === RIGHT) {
          fill(34, 139, 34, 150);
        }
      }
      rect(col * tileSize, row * tileSize, tileSize, tileSize);
    }

    pop();
  }

  drawCashRegisterPreview(x, y) {
    // Implement a simple rectangle or sprite to represent the Cash Register preview
    push();
    noStroke();
    fill(128, 128, 128, 150); // Semi-transparent grey
    rect(x - 20, y - 15, 40, 30, 5); // Width: 40, Height: 30
    pop();
  }

  updateDraw(p5) {
    // Draw non-grid buildings (tables, beds, cash registers)
    for (let b of this.nonGridBuildings) {
      p5.noStroke();
      p5.fill(b.color);
      p5.rect(b.x, b.y, b.w, b.h);

      // Optionally, add specific visuals based on type
      if (b.type === 'cash_register') {
        // Draw additional details for Cash Register
        p5.fill(200);
        p5.rect(b.x + 5, b.y + 5, b.w - 10, b.h - 10);
      }
    }
  }
}
