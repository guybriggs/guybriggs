import { tileSize, mapCols, mapRows, tileMap, colorForTileType } from '../tile/TileMap.js';

export class TileRenderSystem {
  update(world, playerEntity, scaleFactor) {
    const playerPos = world.getComponent(playerEntity, 'Position');
    if (!playerPos) return;
    
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
        
        // Use transparent fill if tile is in blueprint mode
        if(tile.transparent === true) {
          let grey;
          switch(tile.type) {
            case 'white_bricks': // Wall
              grey = color(211, 211, 211); // Light grey
              break;
            case 'dark_floor':   // Floor
              grey = color(169, 169, 169); // Darker grey
              break;
            case 'door_tile':    // Door
              grey = color(128, 128, 128); // Medium grey
              break;
            default:
              grey = color(192, 192, 192); // Default grey for other types
          }
          fill(grey);
        } else {
          fill(colorForTileType(tile.type));
        }
        rect(col * tileSize - 1, row * tileSize - 1, tileSize + 2, tileSize + 2);
        // Expand rect slightly to avoid visual seams
        
        // Grass sprite
        if (tile.type === 'grassland') {
          push();
          fill('#BACA2C');
          let gx = col * tileSize + tileSize/2;
          let gy = row * tileSize + tileSize - 6;
          triangle(gx, gy, gx - 3, gy + 6, gx + 3, gy + 6);
          pop();
        }

        // Forest with tree logic
        if(tile.type === 'forest') {
          if(!tile.hasTree && millis() > tile.regenTime) {
            tile.hasTree = true;
          }
          if(tile.hasTree) {
            const now = millis();
            const isWobbling = tile.wobbleEndTime && tile.wobbleEndTime > now;
            if (isWobbling) {
              push();
              let offsetX = col * tileSize + tileSize / 2;
              let offsetY = row * tileSize + tileSize;
              translate(offsetX, offsetY);
              rotate(sin(now * 0.02) * 0.1);
              translate(-offsetX, -offsetY);
            }
            // Draw trunk
            fill('#877555');
            let trunkWidth = tileSize / 8;
            let trunkHeight = tileSize / 2;
            let trunkX = col * tileSize + tileSize/2 - trunkWidth/2;
            let trunkY = row * tileSize + tileSize - trunkHeight;
            rect(trunkX, trunkY, trunkWidth, trunkHeight);

            // Pine shape
            fill('#397A2B');
            let centerX = col * tileSize + tileSize/2;
            let baseY = trunkY;
            triangle(centerX, baseY - tileSize*0.8,
                     centerX - tileSize/2, baseY,
                     centerX + tileSize/2, baseY);
            triangle(centerX, baseY - tileSize*1.2,
                     centerX - tileSize/3, baseY - tileSize*0.4,
                     centerX + tileSize/3, baseY - tileSize*0.4);
            triangle(centerX, baseY - tileSize*1.6,
                     centerX - tileSize/4, baseY - tileSize*0.8,
                     centerX + tileSize/4, baseY - tileSize*0.8);

            if (isWobbling) {
              pop();
            }
          }
        }
      }
    }
  }
}
