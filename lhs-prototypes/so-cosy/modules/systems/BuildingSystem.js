// modules/systems/BuildingSystem.js
import { tileSize, tileMap, mapCols, mapRows } from '../tile/TileMap.js';

export class BuildingSystem {
  constructor() {
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

    // Non-grid items
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
      if (selectedCard === 'bed') {
        // bed is 35x50
      }
      rect(worldX - w/2, worldY - h/2, w, h);
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

  updateDraw(p5) {
    // For table/bed
    for (let b of this.nonGridBuildings) {
      p5.noStroke();
      p5.fill(b.color);
      p5.rect(b.x, b.y, b.w, b.h);
    }
  }
}
