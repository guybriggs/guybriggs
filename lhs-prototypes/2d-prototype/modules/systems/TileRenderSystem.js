// modules/tile/TileRenderSystem.js
import { tileSize, mapCols, mapRows, tileMap, colorForTileType } from '../tile/TileMap.js';

export class TileRenderSystem {
  update(world, playerEntity, scaleFactor) {
    const playerPos = world.getComponent(playerEntity, 'Position');
    if(!playerPos) return;
    
    // Calculate visible world dimensions based on current zoom
    let visibleWidth = width / scaleFactor;
    let visibleHeight = height / scaleFactor;
    
    let startCol = Math.max(Math.floor((playerPos.x - visibleWidth/2) / tileSize), 0);
    let startRow = Math.max(Math.floor((playerPos.y - visibleHeight/2) / tileSize), 0);
    let endCol = Math.min(Math.ceil((playerPos.x + visibleWidth/2) / tileSize), mapCols);
    let endRow = Math.min(Math.ceil((playerPos.y + visibleHeight/2) / tileSize), mapRows);

    noStroke();
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        let tile = tileMap[row][col];
        // Inside TileRenderSystem.update, when drawing a tile:
        fill(colorForTileType(tile.type));
        // Expand rectangle slightly to avoid gaps due to rounding
        rect(col * tileSize - 1, row * tileSize - 1, tileSize + 2, tileSize + 2);
        
        // Pine tree rendering code follows...
        if(tile.type === 'forest') {
          if(!tile.hasTree && millis() > tile.regenTime) {
            tile.hasTree = true;
          }
          if(tile.hasTree) {
            fill(139,69,19);
            let trunkWidth = tileSize / 8;
            let trunkHeight = tileSize / 2;
            let trunkX = col * tileSize + tileSize/2 - trunkWidth/2;
            let trunkY = row * tileSize + tileSize - trunkHeight;
            rect(trunkX, trunkY, trunkWidth, trunkHeight);
            
            fill(34,139,34);
            let centerX = col * tileSize + tileSize/2;
            let baseY = trunkY;
            triangle(centerX, baseY - tileSize*0.8, centerX - tileSize/2, baseY, centerX + tileSize/2, baseY);
            triangle(centerX, baseY - tileSize*1.2, centerX - tileSize/3, baseY - tileSize*0.4, centerX + tileSize/3, baseY - tileSize*0.4);
            triangle(centerX, baseY - tileSize*1.6, centerX - tileSize/4, baseY - tileSize*0.8, centerX + tileSize/4, baseY - tileSize*0.8);
          }
        }
      }
    }
  }
}
