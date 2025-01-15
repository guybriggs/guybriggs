// modules/utils/EnvironmentUtils.js
import {
  gatherEnclosedCells,
  isEnclosedRegion,
  isWallOrDoorCell
} from './BFSUtils.js';   // from the new BFSUtils file

import { tileMap, tileSize, mapCols, mapRows } from '../tile/TileMap.js';  

const WALL_TYPES = ['white_bricks'];
const DOOR_TYPES = ['door_tile'];

/**
 * Checks if a position is in a fully enclosed region
 * (surrounded by walls/doors). 
 * If BFS can reach outside => not enclosed.
 */
export function isInFullyEnclosedRegion(pos) {
  const gx = Math.floor(pos.x / tileSize);
  const gy = Math.floor(pos.y / tileSize);
  if (gx < 0 || gy < 0 || gx >= mapCols || gy >= mapRows) {
    return false;
  }
  // Reuse isEnclosedRegion from BFSUtils
  return isEnclosedRegion(gx, gy);
}

/**
 * Retrieves all wall tiles ("white_bricks") 
 * around the enclosed region that includes pos.
 */
export function getHouseWalls(pos) {
  const gx = Math.floor(pos.x / tileSize);
  const gy = Math.floor(pos.y / tileSize);
  if (!isInFullyEnclosedRegion(pos)) return [];

  const enclosedCells = gatherEnclosedCells(gx, gy);
  if (!enclosedCells) return [];

  const walls = new Set();
  enclosedCells.forEach(cell => {
    const neighbors = [
      { gx: cell.gx + 1, gy: cell.gy },
      { gx: cell.gx - 1, gy: cell.gy },
      { gx: cell.gx, gy: cell.gy + 1 },
      { gx: cell.gx, gy: cell.gy - 1 }
    ];
    neighbors.forEach(n => {
      if (isWallOrDoorCell(n.gx, n.gy)) {
        walls.add(`${n.gx},${n.gy}`);
      }
    });
  });
  
  return Array.from(walls).map(key => {
    const [gx, gy] = key.split(',').map(Number);
    return { gx, gy };
  });
}

export function isInGrassland(pos) {
  return (
    pos.x >= 0 && pos.x < 2000 &&
    pos.y >= 0 && pos.y < 2000
  );
}

export function isInForest(pos) {
  const col = Math.floor(pos.x / tileSize);
  const row = Math.floor(pos.y / tileSize);
  if (row < 0 || col < 0 || row >= mapRows || col >= mapCols) return false;
  return tileMap[row][col].type === 'forest';
}

// Re-add houseHasUpgrades so FollowerSystem can import it:
export function houseHasUpgrades(pos) {
  // 1) if not enclosed => false
  if (!isInFullyEnclosedRegion(pos)) return false;

  const gx = Math.floor(pos.x / tileSize);
  const gy = Math.floor(pos.y / tileSize);
  const enclosedCells = gatherEnclosedCells(gx, gy);
  if (!enclosedCells) return false;

  // e.g. if you need to check for bed_tile & table_tile or something else:
  let hasBed = false;
  let hasTable = false;
  for (let cell of enclosedCells) {
    const tile = tileMap[cell.gy][cell.gx];
    if (tile.type === 'bed_tile') hasBed = true;
    if (tile.type === 'table_tile') hasTable = true;
    if (hasBed && hasTable) break;
  }
  return (hasBed && hasTable);
}
