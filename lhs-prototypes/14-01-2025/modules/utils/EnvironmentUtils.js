import { tileMap, tileSize, mapCols, mapRows, colorForTileType } from '../tile/TileMap.js';

const WALL_TYPES = ['white_bricks'];
const DOOR_TYPES = ['door_tile'];

/**
 * Checks if a position is in a fully enclosed region (surrounded by walls/doors).
 * Uses BFS. If BFS can reach outside the map => not enclosed.
 */
export function isInFullyEnclosedRegion(pos) {
  const gx = Math.floor(pos.x / tileSize);
  const gy = Math.floor(pos.y / tileSize);

  // If already out of bounds, not enclosed
  if (gx < 0 || gy < 0 || gx >= mapCols || gy >= mapRows) {
    return false;
  }
  return isEnclosedByWallsOrDoors(gx, gy);
}

/**
 * BFS from (startGX, startGY). If we can escape the map => not enclosed.
 * If all we see is passable cells (no walls/doors) => enclosed.
 */
function isEnclosedByWallsOrDoors(startGX, startGY) {
  const visited = new Set();
  const stack = [{ gx: startGX, gy: startGY }];

  while (stack.length > 0) {
    const { gx, gy } = stack.pop();

    // If we go out of bounds => not enclosed
    if (gx < 0 || gy < 0 || gx >= mapCols || gy >= mapRows) {
      return false;
    }

    const key = `${gx},${gy}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (isWallOrDoorCell(gx, gy)) {
      // We cannot pass through walls/doors
      continue;
    }

    // Expand to neighbors
    stack.push({ gx: gx + 1, gy });
    stack.push({ gx: gx - 1, gy });
    stack.push({ gx, gy: gy + 1 });
    stack.push({ gx, gy: gy - 1 });
  }
  return true;
}

function isWallOrDoorCell(gx, gy) {
  const tile = tileMap[gy]?.[gx];
  if (!tile) return false;
  return (WALL_TYPES.includes(tile.type) || DOOR_TYPES.includes(tile.type));
}

/**
 * Retrieves all wall tiles ("white_bricks") surrounding the house containing the given position.
 * @param {Object} pos - The position object with x and y properties.
 * @returns {Array} Array of objects with gx and gy properties indicating grid positions of walls.
 */
export function getHouseWalls(pos) {
  const gx = Math.floor(pos.x / tileSize);
  const gy = Math.floor(pos.y / tileSize);
  
  const enclosed = isInFullyEnclosedRegion(pos);
  if (!enclosed) return [];
  
  const enclosedCells = gatherEnclosedCells(gx, gy);
  if (!enclosedCells) return [];
  
  // Find perimeter tiles: tiles adjacent to non-enclosed cells that are walls
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
  
  // Convert Set to array of {gx, gy}
  const wallTiles = Array.from(walls).map(key => {
    const [gx, gy] = key.split(',').map(Number);
    return { gx, gy };
  });
  return wallTiles;
}

/**
 * BFS that collects passable cells in the region 
 * (if it ever escapes the map => returns null).
 */
function gatherEnclosedCells(startGX, startGY) {
  const visited = new Set();
  const result = [];
  const stack = [{ gx: startGX, gy: startGY }];

  while (stack.length > 0) {
    const { gx, gy } = stack.pop();
    if (gx < 0 || gy < 0 || gx >= mapCols || gy >= mapRows) {
      // not enclosed => bail
      return null;
    }

    const key = `${gx},${gy}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (isWallOrDoorCell(gx, gy)) {
      // can't pass
      continue;
    }

    result.push({ gx, gy });

    stack.push({ gx: gx + 1, gy });
    stack.push({ gx: gx - 1, gy });
    stack.push({ gx, gy: gy + 1 });
    stack.push({ gx, gy: gy - 1 });
  }
  return result;
}

/**
 * Check if there's a building of given type (bed/table) 
 * in the enclosed region's grid cells.
 */
export function houseHasUpgrades(pos, nonGridBuildings = []) {
  // 1) Check if pos is even enclosed
  if (!isInFullyEnclosedRegion(pos)) {
    return false;
  }

  // 2) BFS to gather all passable cells in this enclosed region
  const gx = Math.floor(pos.x / tileSize);
  const gy = Math.floor(pos.y / tileSize);
  const enclosedCells = gatherEnclosedCells(gx, gy);
  if (!enclosedCells) {
    return false;
  }

  // 3) Check if we found both bed & table in the enclosed region
  const bedFound = findNonGridItemInRegion('bed', enclosedCells, nonGridBuildings);
  const tableFound = findNonGridItemInRegion('table', enclosedCells, nonGridBuildings);

  return (bedFound && tableFound);
}

/**
 * Check if a specific item type exists within the enclosed region.
 */
function findNonGridItemInRegion(itemType, enclosedCells, nonGridBuildings) {
  for (let b of nonGridBuildings) {
    if (b.type !== itemType) continue;

    // The building's center in grid coords
    const centerGX = Math.floor((b.x + b.w/2) / tileSize);
    const centerGY = Math.floor((b.y + b.h/2) / tileSize);

    // If (centerGX, centerGY) is inside the enclosed region => found
    if (enclosedCells.some(c => c.gx === centerGX && c.gy === centerGY)) {
      return true;
    }
  }
  return false;
}

/**
 * isInGrassland(pos)
 */
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
