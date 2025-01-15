// modules/systems/ApartmentSystem.js

import { tileMap, tileSize, mapRows, mapCols } from '../tile/TileMap.js';

/**
 * ApartmentSystem:
 *  - Looks for four fully built dark_floor tiles (transparent=false)
 *  - Looks for at least one fully built key (nonGridBuildings item with type='key', transparent=false)
 *  - Once found, spawns a single red dot (type='redDot') in buildingSystem.nonGridBuildings,
 *    placed at the average center of the four floor tiles, layered on top.
 */
export class ApartmentSystem {
  constructor() {
    this.nextCheckTime = 0;
    this.checkInterval = 3000; // Check every 3s
    this.spawnedRedDot = false;
  }

  update(world, dt) {
    const now = millis();
    if (now < this.nextCheckTime) return;
    this.nextCheckTime = now + this.checkInterval;

    if (this.spawnedRedDot) return; 
    // If we've already placed the red dot, skip.

    // 1) Gather exactly four fully built floor tiles 
    //    => tile.type='dark_floor' && tile.transparent===false
    const floorCells = [];
    for (let r = 0; r < mapRows; r++) {
      for (let c = 0; c < mapCols; c++) {
        const tile = tileMap[r][c];
        if (tile.type === 'dark_floor' && tile.transparent === false) {
          floorCells.push({ r, c });
        }
      }
    }
    if (floorCells.length !== 4) return;

    // 2) Check for at least one fully built key (transparent=false)
    const bSys = world.buildingSystem;
    if (!bSys) return;
    let hasKey = false;
    for (let b of bSys.nonGridBuildings) {
      if (b.type === 'key' && b.transparent === false) {
        hasKey = true;
        break;
      }
    }
    if (!hasKey) return;

    // => We have 4 floors + at least 1 key, fully built => apartment done
    const { x, y } = this.computeFloorCenter(floorCells);

    // Insert a "redDot" in buildingSystem.nonGridBuildings
    this.spawnRedDot(bSys, x, y);

    this.spawnedRedDot = true;
  }

  computeFloorCenter(floorCells) {
    let sumX = 0, sumY = 0;
    for (let cell of floorCells) {
      // center of each tile
      const centerX = cell.c * tileSize + tileSize / 2;
      const centerY = cell.r * tileSize + tileSize / 2;
      sumX += centerX;
      sumY += centerY;
    }
    const n = floorCells.length;
    return { x: sumX / n, y: sumY / n };
  }

  spawnRedDot(buildingSystem, x, y) {
    // We'll place a 10×10 red block (or dot). 
    // It's a non-grid building with type='redDot' so buildingSystem's updateDraw can layer it on top.

    buildingSystem.nonGridBuildings.push({
      x: x - 5, // center it
      y: y - 5,
      w: 10,
      h: 10,
      color: 'red',
      type: 'redDot',
      transparent: false // fully built
    });
  }
}
