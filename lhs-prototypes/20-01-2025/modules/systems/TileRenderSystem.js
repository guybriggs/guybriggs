// modules/systems/TileRenderSystem.js

import { tileSize, mapCols, mapRows, tileMap } from '../tile/TileMap.js';
import { spriteMappings } from '../utils/SpriteMapping.js';

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
        
        let spriteArr = Object.keys(spriteMappings);
        let sprite = spriteArr.includes(tile.type) ? tile.type : 'test';
        spriteMappings[sprite].draw(
          tile,
          col * tileSize - 1,
          row * tileSize - 1,
          tileSize + 2
        );

        if (tile.inventory) {
          const inventoryArray = Object.keys(tile.inventory.items);
          if (inventoryArray.length > 0) {
            for (let i = 0; i < inventoryArray.length; i++) {
              const item = inventoryArray[i];
              const string = tile.inventory.items[item] + ' ' + item;
              fill(0);
              text(
                string, 
                col * tileSize,
                row * tileSize + i * 25,
              );
            }
          }
        }

        if (tile.type == 'cashregister') {
          const supplyComp = world.getComponent(tile.claimed, 'Supply');
          if (supplyComp) {
            fill(0);
            text(
              '$' + supplyComp.reservationPrice, 
              col * tileSize,
              row * tileSize - tileSize/2,
            );
          }
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
