// modules/systems/TileRenderSystem.js

import { tileSize, mapCols, mapRows, tileMap, colorForTileType } from '../tile/TileMap.js';

export class TileRenderSystem {
  update(world, playerEntity, scaleFactor) {
    const playerPos = world.getComponent(playerEntity, 'Position');
    if (!playerPos) return;
    
    let visibleWidth = width / scaleFactor;
    let visibleHeight = height / scaleFactor;
    
    let startCol = Math.max(Math.floor((playerPos.x - visibleWidth / 2) / tileSize), 0);
    let startRow = Math.max(Math.floor((playerPos.y - visibleHeight / 2) / tileSize), 0);
    let endCol = Math.min(Math.ceil((playerPos.x + visibleWidth / 2) / tileSize), mapCols);
    let endRow = Math.min(Math.ceil((playerPos.y + visibleHeight / 2) / tileSize), mapRows);

    noStroke();
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        let tile = tileMap[row][col];
        
        // If tile is blueprint
        if (tile.transparent === true) {
          let grey;
          switch(tile.type) {
            case 'white_bricks':      // wall
              grey = color(211, 211, 211);
              break;
            case 'dark_floor':        // floor
              grey = color(169, 169, 169);
              break;
            case 'door_tile':         // door
              grey = color(128, 128, 128);
              break;
            case 'bed_tile':          // bed blueprint
              grey = color(192, 192, 192);
              break;
            case 'table_tile':        // table blueprint
              grey = color(140); // some mid-grey
              break;
            case 'key_tile':          // key blueprint
              grey = color(160); // another shade of grey
              break;
            default:
              grey = color(192, 192, 192);
              break;
          }
          fill(grey);

        // If tile is fully built
        } else {
          // check for special tile types
          if (tile.type === 'bed_tile') {
            fill('#ADD8E6'); // Light blue
          } 
          else if (tile.type === 'table_tile') {
            fill('#d9a774'); // Light brown for final table
          }
          else if (tile.type === 'key_tile') {
            fill('#FFD700'); // Gold for final key
          } 
          else {
            // fallback on your colorForTileType
            fill(colorForTileType(tile.type));
          }
        }

        // draw the tile with slight oversize
        rect(col * tileSize - 1, row * tileSize - 1, tileSize + 2, tileSize + 2);

        // any extra logic for grass or forest...
        if (tile.type === 'grassland') {
          push();
          fill('#BACA2C');
          let gx = col * tileSize + tileSize / 2;
          let gy = row * tileSize + tileSize - 6;
          triangle(gx, gy, gx - 3, gy + 6, gx + 3, gy + 6);
          pop();
        }

        if (tile.type === 'forest') {
          if (!tile.hasTree && millis() > tile.regenTime) {
            tile.hasTree = true;
          }
          if (tile.hasTree) {
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
            // trunk
            fill('#877555');
            let trunkWidth = tileSize / 8;
            let trunkHeight = tileSize / 2;
            let trunkX = col * tileSize + tileSize / 2 - trunkWidth / 2;
            let trunkY = row * tileSize + tileSize - trunkHeight;
            rect(trunkX, trunkY, trunkWidth, trunkHeight);

            // pine shape
            fill('#397A2B');
            let centerX = col * tileSize + tileSize / 2;
            let baseY = trunkY;
            triangle(
              centerX, baseY - tileSize * 0.8,
              centerX - tileSize / 2, baseY,
              centerX + tileSize / 2, baseY
            );
            triangle(
              centerX, baseY - tileSize * 1.2,
              centerX - tileSize / 3, baseY - tileSize * 0.4,
              centerX + tileSize / 3, baseY - tileSize * 0.4
            );
            triangle(
              centerX, baseY - tileSize * 1.6,
              centerX - tileSize / 4, baseY - tileSize * 0.8,
              centerX + tileSize / 4, baseY - tileSize * 0.8
            );

            if (isWobbling) {
              pop();
            }
          }
        }
      }
    }
  }
}
