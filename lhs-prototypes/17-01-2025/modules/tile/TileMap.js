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