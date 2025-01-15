import { tileMap, tileSize, mapRows, mapCols } from '../tile/TileMap.js';
import { gatherEnclosedCells } from '../utils/BFSUtils.js'; 
// BFS that returns null if region escapes => not enclosed

export class ApartmentSystem {
  constructor() {
    // We can keep track to avoid re-checking once complete
  }

  update(world, dt) {
    // If we've already found an apartment, do nothing
    if (world.apartmentComplete) return;

    // Scan for any 'dark_floor' that's fully built (transparent=false)
    for (let r = 0; r < mapRows; r++) {
      for (let c = 0; c < mapCols; c++) {
        const tile = tileMap[r][c];
        if (tile.type === 'dark_floor' && tile.transparent === false) {
          // BFS from (c, r)
          const enclosedCells = gatherEnclosedCells(c, r);
          // If null => region escapes => not enclosed
          if (!enclosedCells) continue;

          // If BFS returned an array, check how many built floor tiles
          let floorCount = 0;
          for (let cell of enclosedCells) {
            const t2 = tileMap[cell.gy][cell.gx];
            if (t2.type === 'dark_floor' && t2.transparent === false) {
              floorCount++;
            }
          }

          // If >= 4 enclosed floors, we treat it as an "apartment"
          if (floorCount >= 4) {
            world.apartmentComplete = true;
            console.log('ApartmentSystem => enclosed region found => apartmentComplete=true');
            return;
          }
        }
      }
    }
  }
}
