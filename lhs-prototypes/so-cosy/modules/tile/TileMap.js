export const tileSize = 32;
export const worldWidth = 2000;
export const worldHeight = 2000;
export const mapCols = Math.floor(worldWidth / tileSize);
export const mapRows = Math.floor(worldHeight / tileSize);

// Our main 2D array of tiles
export let tileMap = [];

/**
 * generateTileMap()
 *  - Seeds noise with a random seed
 *  - For each tile cell, picks a tile type based on noise & distance from center
 *  - Optionally spawns a tree if it's forest (50% chance)
 */
export function generateTileMap() {
  noiseSeed(Math.floor(Math.random() * 10000));
  
  for (let y = 0; y < mapRows; y++) {
    tileMap[y] = [];
    for (let x = 0; x < mapCols; x++) {
      // Distance-based factor to push certain tiles outward
      let nx = x / mapCols - 0.5;
      let ny = y / mapRows - 0.5;
      let d = sqrt(nx * nx + ny * ny);

      // Sample 2D noise
      let noiseVal = noise(x * 0.1, y * 0.1);
      let value = noiseVal - d;

      let type;
      if (value < -0.05) {
        type = 'ocean';
      } else if (value < 0) {
        type = 'beach';
      } else if (value < 0.3) {
        type = 'grassland';
      } else if (value < 0.5) {
        type = 'forest';
      } else if (value < 0.7) {
        type = 'mountain';
      } else {
        type = 'lake';
      }

      // Fill tile data
      tileMap[y][x] = {
        type: type,
        // 50% chance for a tree if forest
        hasTree: (type === 'forest' && random() < 0.5),
        regenTime: 0
      };
    }
  }
}

/**
 * colorForTileType(tileType)
 *  - Returns a p5 color for each base tile type and also
 *    custom building tiles: white_bricks, dark_floor, door_tile, etc.
 */
export function colorForTileType(tileType) {
  switch (tileType) {
    case 'ocean':
      return color(0, 105, 148);
    case 'beach':
      return color(238, 214, 175);
    case 'grassland':
      return color(34, 139, 34);
    case 'forest':
      return color(0, 100, 0);
    case 'mountain':
      return color(139, 137, 137);
    case 'lake':
      return color(0, 191, 255);

    // Building / custom tiles
    case 'white_bricks': 
      return color(245, 245, 245);  // for walls
    case 'dark_floor':
      return color(70, 40, 10);     // dark brown floor
    case 'door_tile':
      return color(195, 142, 90);   // light brown door

    default:
      // fallback
      return color(0);
  }
}
