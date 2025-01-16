import { tileMap, tileSize, mapRows, mapCols } from '../tile/TileMap.js';
import { gatherEnclosedCells } from '../utils/BFSUtils.js'; 
// BFS that returns null if region escapes => not enclosed

export class ApartmentSystem {
  constructor() {
    // Optionally track if we stored a tile
    this.storedTile = null;
  }

  update(world, dt) {
    if (world.apartmentComplete) return;

    // Scan for any 'dark_floor' that's fully built
    for (let r = 0; r < mapRows; r++) {
      for (let c = 0; c < mapCols; c++) {
        const tile = tileMap[r][c];
        if (tile.type === 'dark_floor' && tile.transparent === false) {
          const enclosedCells = gatherEnclosedCells(c, r);
          if (!enclosedCells) continue;

          // Count how many built floors
          let floorCount = 0;
          for (let cell of enclosedCells) {
            const t2 = tileMap[cell.gy][cell.gx];
            if (t2.type === 'dark_floor' && t2.transparent === false) {
              floorCount++;
            }
          }

          if (floorCount >= 4) {
            world.apartmentComplete = true;
            console.log('ApartmentSystem => enclosed region found => apartmentComplete=true');

            // **Store a tile** from that region so we know an inside tile:
            // e.g. just pick the BFS starting point (c, r) 
            // or the first tile from enclosedCells.
            // We'll store it globally on the world object:
            world.apartmentInsideTile = { gx: c, gy: r };

            return;
          }
        }
      }
    }
  }
}
