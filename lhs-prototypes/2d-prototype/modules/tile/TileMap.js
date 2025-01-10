// modules/tile/TileMap.js
export const tileSize = 32;
export const worldWidth = 2000;
export const worldHeight = 2000;
export const mapCols = Math.floor(worldWidth / tileSize);
export const mapRows = Math.floor(worldHeight / tileSize);
export let tileMap = [];

export function generateTileMap() {
  noiseSeed(Math.floor(Math.random() * 10000));
  for (let y = 0; y < mapRows; y++) {
    tileMap[y] = [];
    for (let x = 0; x < mapCols; x++) {
      let nx = x / mapCols - 0.5;
      let ny = y / mapRows - 0.5;
      let d = sqrt(nx * nx + ny * ny);
      let noiseVal = noise(x * 0.1, y * 0.1);
      let value = noiseVal - d;
      let type;
      if (value < -0.05) type = 'ocean';
      else if (value < 0) type = 'beach';
      else if (value < 0.3) type = 'grassland';
      else if (value < 0.5) type = 'forest';
      else if (value < 0.7) type = 'mountain';
      else type = 'lake';

      tileMap[y][x] = {
        type: type,
        hasTree: (type === 'forest' && random() < 0.5), // 50% chance for a tree
        regenTime: 0
      };
    }
  }
}

export function colorForTileType(tileType) {
  switch(tileType) {
    case 'ocean':     return color(0, 105, 148);
    case 'beach':     return color(238, 214, 175);
    case 'grassland': return color(34, 139, 34);
    case 'forest':    return color(0, 100, 0);
    case 'mountain':  return color(139, 137, 137);
    case 'lake':      return color(0, 191, 255);
    default:          return color(0);
  }
}
