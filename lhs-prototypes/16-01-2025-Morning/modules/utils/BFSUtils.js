// modules/utils/BFSUtils.js
import { tileMap, tileSize, mapCols, mapRows } from '../tile/TileMap.js';

/** The tile types you treat as walls */
const WALL_TYPES = ['white_bricks', 'stone_bricks'];
/** The tile types you treat as doors */
const DOOR_TYPES = ['door_tile'];

function isWallOrDoorCell(gx, gy) {
  const tile = tileMap[gy]?.[gx];
  if (!tile) return false;
  return (
    WALL_TYPES.includes(tile.type) ||
    DOOR_TYPES.includes(tile.type)
  );
}

/**
 * gatherEnclosedCells:
 * BFS from (startGX, startGY). If we can escape map => returns null (not enclosed).
 * Otherwise returns an array of passable cells in the enclosed region.
 */
export function gatherEnclosedCells(startGX, startGY) {
  const visited = new Set();
  const result = [];
  const stack = [{ gx: startGX, gy: startGY }];

  while (stack.length > 0) {
    const { gx, gy } = stack.pop();

    // If we go out of bounds => region escapes => not enclosed
    if (gx < 0 || gy < 0 || gx >= mapCols || gy >= mapRows) {
      return null;
    }

    const key = `${gx},${gy}`;
    if (visited.has(key)) continue;
    visited.add(key);

    // If it's a wall or door => can't pass here
    if (isWallOrDoorCell(gx, gy)) {
      continue;
    }

    // It's passable => add to result
    result.push({ gx, gy });

    // Expand neighbors
    stack.push({ gx: gx + 1, gy });
    stack.push({ gx: gx - 1, gy });
    stack.push({ gx, gy: gy + 1 });
    stack.push({ gx, gy: gy - 1 });
  }
  return result;
}

/**
 * isEnclosedRegion:
 * A wrapper that returns TRUE if BFS from (gx,gy) is fully enclosed.
 */
export function isEnclosedRegion(gx, gy) {
  // If gatherEnclosedCells(...) returns null, not enclosed
  const enclosed = gatherEnclosedCells(gx, gy);
  return !!enclosed;
}

/**
 * alreadyHasKeyInRegion:
 * 1) Gathers enclosed cells from (gx, gy).
 * 2) Checks if there's any 'key_tile' among them.
 * Returns true if found, false otherwise.
 */
export function alreadyHasKeyInRegion(gx, gy) {
  const enclosed = gatherEnclosedCells(gx, gy);
  if (!enclosed) return false; // not enclosed, or escapes => no tiles to check

  for (let cell of enclosed) {
    const t = tileMap[cell.gy][cell.gx];
    if (t.type === 'key_tile') {
      return true;
    }
  }
  return false;
}

/**
 * isWallOrDoorCell - OPTIONAL EXPORT
 * Sometimes you'll need it in other files, so you can export it.
 */
export { isWallOrDoorCell };
