// modules/systems/TileRenderSystem.js

import { tileSize, mapCols, mapRows, tileMap } from '../tile/TileMap.js';
import { spriteMappings } from '../utils/SpriteMapping.js';

/**
 * A small helper to draw a fish shape at (x, y) using a given color.
 */
function drawColoredFish(p5, x, y, color) {
  p5.push();
  p5.noStroke();
  p5.fill(color);
  // Draw a small ellipse for the fish body
  p5.ellipse(x, y, 10, 6);
  // Draw a triangular tail on the left side
  p5.triangle(
    x - 5, y,
    x - 8, y - 3,
    x - 8, y + 3
  );
  p5.pop();
}

export class TileRenderSystem {
  /**
   * Renders visible tiles, including stacked fish for fishingrod, red_carpet, and icebox.
   * If fish < 0, we render black fish for the absolute value of that number.
   * If fish > 0, we render normal blue fish.
   * Wasted fish are green.
   *
   * @param {World} world
   * @param {p5} p5 - the p5 instance
   * @param {number} playerEntity
   * @param {number} scaleFactor
   */
  update(world, p5, playerEntity, scaleFactor) {
    const playerPos = world.getComponent(playerEntity, 'Position');
    if (!playerPos) return;

    // Use p5.width and p5.height for visible area
    const visibleWidth = p5.width / scaleFactor;
    const visibleHeight = p5.height / scaleFactor;

    const startCol = Math.max(Math.floor((playerPos.x - visibleWidth / 2) / tileSize), 0);
    const startRow = Math.max(Math.floor((playerPos.y - visibleHeight / 2) / tileSize), 0);
    const endCol = Math.min(Math.ceil((playerPos.x + visibleWidth / 2) / tileSize), mapCols);
    const endRow = Math.min(Math.ceil((playerPos.y + visibleHeight / 2) / tileSize), mapRows);

    p5.noStroke();

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = tileMap[row][col];

        // 1) Draw the base sprite
        const spriteKey = spriteMappings[tile.type] ? tile.type : 'test';
        spriteMappings[spriteKey].draw(
          tile,
          col * tileSize - 1,
          row * tileSize - 1,
          tileSize + 2
        );

        // 2) We'll handle fish stacking if it's fishingrod, red_carpet, or icebox
        const tileType = tile.type;
        if (tileType === 'fishingrod' || tileType === 'red_carpet' || tileType === 'icebox') {
          if (tile.inventory && tile.inventory.items) {
            const rawFishCount = tile.inventory.items.fish || 0;
            const wastedCount = tile.inventory.items.wasted_fish || 0;

            // Separate normal vs. negative fish
            let normalFishCount = 0;
            let blackFishCount = 0;
            if (rawFishCount < 0) {
              blackFishCount = Math.abs(rawFishCount); // e.g. -3 => 3 black fish
            } else {
              normalFishCount = rawFishCount; // positive => normal fish
            }

            // If there's any fish or wasted fish, draw them stacked
            if (normalFishCount > 0 || blackFishCount > 0 || wastedCount > 0) {
              const tileCenterX = col * tileSize + tileSize / 2;
              const tileCenterY = row * tileSize + tileSize / 2;
              let offsetIndex = 0;

              // a) Normal fish => blue
              for (let i = 0; i < normalFishCount; i++) {
                const offsetY = -10 * offsetIndex;
                drawColoredFish(
                  p5,
                  tileCenterX,
                  tileCenterY + offsetY - 10,
                  '#82c8fa'
                );
                offsetIndex++;
              }

              // b) Negative fish => black (here it's set to '#E76868', can be changed if you prefer black)
              for (let i = 0; i < blackFishCount; i++) {
                const offsetY = -10 * offsetIndex;
                drawColoredFish(
                  p5,
                  tileCenterX,
                  tileCenterY + offsetY - 10,
                  '#F3150A'
                );
                offsetIndex++;
              }

              // c) Wasted fish => green
              for (let i = 0; i < wastedCount; i++) {
                const offsetY = -10 * offsetIndex;
                drawColoredFish(
                  p5,
                  tileCenterX,
                  tileCenterY + offsetY - 10,
                  '#33cc33'
                );
                offsetIndex++;
              }
            }
          }
        }
        else {
          // 3) If not fishingrod/red_carpet/icebox, show text-based inventory for debugging
          if (tile.inventory) {
            const inventoryArray = Object.keys(tile.inventory.items);
            if (inventoryArray.length > 0) {
              for (let i = 0; i < inventoryArray.length; i++) {
                const item = inventoryArray[i];
                const count = tile.inventory.items[item];
                p5.fill(0);
                p5.text(
                  count + ' ' + item,
                  col * tileSize,
                  row * tileSize + i * 25
                );
              }
            }
          }
        }

        // 4) If tile is a locker/fishingrod/icebox => show supply price
        if (tileType === 'locker' || tileType === 'fishingrod' || tileType === 'icebox') {
          const supplyComp = world.getComponent(tile.claimed, 'Supply');
          if (supplyComp) {
            p5.fill(0);
            p5.textSize(12);
            p5.text(
              '$' + supplyComp.reservationPrice,
              col * tileSize,
              row * tileSize - tileSize / 4
            );
          }
        }

        // NEW: 4b) If tile is a red_carpet & locked to a consumer => show consumer’s price
        if (tileType === 'red_carpet') {
          if (tile.lockedDemand != null) {
            const demComp = world.getComponent(tile.lockedDemand, 'Demand');
            if (demComp) {
              p5.push();
              p5.fill('black');
              p5.textSize(12);

              // Position slightly above the tile
              const textX = col * tileSize + tileSize * 0.1;
              const textY = row * tileSize - tileSize * 0.5;
              p5.text(`$${demComp.reservationPrice}`, textX, textY);
              p5.pop();
            }
          }
        }

        // 5) Forest logic for regrowing + wobbly tree
        if (tileType === 'forest') {
          if (!tile.hasTree && p5.millis() > tile.regenTime) {
            tile.hasTree = true;
          }
          if (tile.hasTree) {
            const now = p5.millis();
            const isWobbling = tile.wobbleEndTime && tile.wobbleEndTime > now;
            if (isWobbling) {
              p5.push();
              let offsetX = col * tileSize + tileSize / 2;
              let offsetY = row * tileSize + tileSize;
              p5.translate(offsetX, offsetY);
              p5.rotate(p5.sin(now * 0.02) * 0.1);
              p5.translate(-offsetX, -offsetY);
            }
            // trunk
            p5.fill('#877555');
            let trunkWidth = tileSize / 8;
            let trunkHeight = tileSize / 2;
            let trunkX = col * tileSize + tileSize / 2 - trunkWidth / 2;
            let trunkY = row * tileSize + tileSize - trunkHeight;
            p5.rect(trunkX, trunkY, trunkWidth, trunkHeight);

            // pine shape
            p5.fill('#397A2B');
            let centerX = col * tileSize + tileSize / 2;
            let baseY = trunkY;
            p5.triangle(
              centerX, baseY - tileSize * 0.8,
              centerX - tileSize / 2, baseY,
              centerX + tileSize / 2, baseY
            );
            p5.triangle(
              centerX, baseY - tileSize * 1.2,
              centerX - tileSize / 3, baseY - tileSize * 0.4,
              centerX + tileSize / 3, baseY - tileSize * 0.4
            );
            p5.triangle(
              centerX, baseY - tileSize * 1.6,
              centerX - tileSize / 4, baseY - tileSize * 0.8,
              centerX + tileSize / 4, baseY - tileSize * 0.8
            );

            if (isWobbling) {
              p5.pop();
            }
          }
        }
      }
    }
  }
}
