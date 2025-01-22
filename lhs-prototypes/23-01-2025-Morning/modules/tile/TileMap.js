// modules/tile/TileMap.js

export const tileSize = 32;
export const worldWidth = 2000;
export const worldHeight = 2000;
export const mapCols = Math.floor(worldWidth / tileSize);
export const mapRows = Math.floor(worldHeight / tileSize);

/**
 * Our main 2D array of tiles, each containing:
 *  - type: string
 *  - hasTree: boolean
 *  - regenTime: number
 *  - inventory: { items: { fish?: number, wasted_fish?: number, ... } }
 */
export let tileMap = [];

/**
 * generateTileMap()
 *  - Seeds noise with a random seed
 *  - For each tile cell, picks a tile type based on noise & distance from center
 *  - Optionally spawns a tree if it's forest (50% chance)
 *  - Also attaches an "inventory" object so the tile can hold fish, wasted_fish, etc.
 */
export function generateTileMap() {
  noiseSeed(Math.floor(Math.random() * 10000));

  for (let row = 0; row < mapRows; row++) {
    tileMap[row] = [];
    for (let col = 0; col < mapCols; col++) {
      // 1) Distance from map center
      const nx = col / mapCols - 0.5;
      const ny = row / mapRows - 0.5;
      const dist = sqrt(nx * nx + ny * ny);

      // 2) Noise sample
      const noiseVal = noise(col * 0.1, row * 0.1);
      const adjustedVal = noiseVal - dist;

      // 3) Pick tile type
      let tileType;
      if (adjustedVal < -0.05) {
        tileType = 'ocean';
      } else if (adjustedVal < 0) {
        tileType = 'beach';
      } else if (adjustedVal < 0.3) {
        tileType = 'grassland';
      } else if (adjustedVal < 0.5) {
        tileType = 'forest';
      } else if (adjustedVal < 0.7) {
        tileType = 'mountain';
      } else {
        tileType = 'lake';
      }

      // 4) Create the tile object
      tileMap[row][col] = {
        type: tileType,
        hasTree: (tileType === 'forest' && random() < 0.5),
        regenTime: 0,
        // We'll store items in "inventory"
        inventory: {
          items: {}
        }
      };
    }
  }
}

/**
 * drawStackedItems()
 *  - Renders both fish and wasted_fish as stacked icons above the tile at (row, col).
 *  - If you want only for fishingrod tiles, just call it conditionally when tile.type === 'fishingrod'.
 *  - If a tile has, say, 5 fish and 2 wasted_fish, it will stack them all in one column:
 *    5 normal fish icons on the bottom, then 2 green wasted fish icons on top.
 *
 * @param {p5} p5 The p5.js instance
 * @param {number} row
 * @param {number} col
 */
export function drawStackedItems(p5, row, col) {
  const tile = tileMap[row][col];
  if (!tile || !tile.inventory) return;

  const items = tile.inventory.items; 
  const fishCount = items.fish || 0;           // normal fish
  const wastedCount = items.wasted_fish || 0;  // wasted fish

  // If neither exist, do nothing
  const totalCount = fishCount + wastedCount;
  if (totalCount <= 0) return;

  const centerX = col * tileSize + tileSize / 2;
  const centerY = row * tileSize + tileSize / 2;

  // We'll stack normal fish first, then wasted fish above that
  // so 5 fish + 2 wasted_fish => the 5 fish at the bottom, 2 wasted on top
  // each offset by -10 pixels in y.
  let offsetIndex = 0;

  // 1) Draw normal fish
  for (let i = 0; i < fishCount; i++) {
    const offsetY = -10 * offsetIndex;
    p5.push();
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(14);
    // a nice yellowish color
    p5.fill('#f2b300');
    p5.noStroke();
    p5.text('🐟', centerX, centerY + offsetY - 10);
    p5.pop();
    offsetIndex++;
  }

  // 2) Draw wasted_fish in green
  for (let i = 0; i < wastedCount; i++) {
    const offsetY = -10 * offsetIndex;
    p5.push();
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(14);
    // A green color to signify wasted fish
    p5.fill('#33cc33');
    p5.noStroke();
    p5.text('🐟', centerX, centerY + offsetY - 10);
    p5.pop();
    offsetIndex++;
  }
}
