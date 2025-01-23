// modules/systems/TileRenderSystem.js

import { tileSize, mapCols, mapRows, tileMap } from '../tile/TileMap.js';
import { spriteMappings } from '../utils/SpriteMapping.js';

/** A helper to draw a potato shape at (x, y) in a given color. */
function drawColoredPotato(p5, x, y, color) {
  p5.push();
  p5.noStroke();
  p5.fill(color);
  // A simple horizontal oval for the potato
  p5.ellipse(x, y, 12, 8);
  p5.pop();
}

/** A helper to draw a fish shape at (x, y) in a given color. */
function drawColoredFish(p5, x, y, color) {
  p5.push();
  p5.noStroke();
  p5.fill(color);
  // Body
  p5.ellipse(x, y, 10, 6);
  // Tail
  p5.triangle(
    x - 5, y,
    x - 8, y - 3,
    x - 8, y + 3
  );
  p5.pop();
}

export class TileRenderSystem {
  update(world, p5, playerEntity, scaleFactor) {
    const playerPos = world.getComponent(playerEntity, 'Position');
    if (!playerPos) return;

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
        const tileType = tile.type;

        // 1) Draw the base sprite
        const spriteKey = spriteMappings[tileType] ? tileType : 'test';
        spriteMappings[spriteKey].draw(
          tile,
          col * tileSize - 1,
          row * tileSize - 1,
          tileSize + 2
        );

        // 2) Fish stacking for fishingrod / icebox / cashregister
        if (tileType === 'fishingrod' || tileType === 'icebox' || tileType === 'cashregister') {
          if (tile.inventory && tile.inventory.items) {
            const fishCount = tile.inventory.items.fish || 0;
            const wastedCount = tile.inventory.items.wasted_fish || 0;

            let normalFishCount = 0;
            let negativeFishCount = 0;
            if (fishCount < 0) {
              negativeFishCount = Math.abs(fishCount);
            } else {
              normalFishCount = fishCount;
            }
            const total = normalFishCount + negativeFishCount + wastedCount;

            if (total > 0) {
              const centerX = col * tileSize + tileSize / 2;
              const centerY = row * tileSize + tileSize / 2;
              let offsetIndex = 0;

              // a) Normal fish => blue
              for (let i = 0; i < normalFishCount; i++) {
                const offsetY = -10 * offsetIndex;
                drawColoredFish(p5, centerX, centerY + offsetY - 10, '#82c8fa');
                offsetIndex++;
              }

              // b) Negative fish => red
              for (let i = 0; i < negativeFishCount; i++) {
                const offsetY = -10 * offsetIndex;
                drawColoredFish(p5, centerX, centerY + offsetY - 10, '#F3150A');
                offsetIndex++;
              }

              // c) Wasted => green
              for (let i = 0; i < wastedCount; i++) {
                const offsetY = -10 * offsetIndex;
                drawColoredFish(p5, centerX, centerY + offsetY - 10, '#33cc33');
                offsetIndex++;
              }
            }
          }
        }
        // 3) If tile is 'potato_seed' => do the potato stacking
        else if (tileType === 'potato_seed') {
          if (tile.inventory && tile.inventory.items) {
            const potatoCount = tile.inventory.items.potato || 0;
            const wastedPotatoCount = tile.inventory.items.wasted_potato || 0;

            let normalPotatoCount = 0;
            let negativePotatoCount = 0;
            if (potatoCount < 0) {
              negativePotatoCount = Math.abs(potatoCount);
            } else {
              normalPotatoCount = potatoCount;
            }

            const total = normalPotatoCount + negativePotatoCount + wastedPotatoCount;
            if (total > 0) {
              const centerX = col * tileSize + tileSize / 2;
              const centerY = row * tileSize + tileSize / 2;
              let offsetIndex = 0;

              // a) Normal potato => light brown
              for (let i = 0; i < normalPotatoCount; i++) {
                const offsetY = -10 * offsetIndex;
                drawColoredPotato(p5, centerX, centerY + offsetY - 10, '#c8a551');
                offsetIndex++;
              }

              // b) Negative potato => red
              for (let i = 0; i < negativePotatoCount; i++) {
                const offsetY = -10 * offsetIndex;
                drawColoredPotato(p5, centerX, centerY + offsetY - 10, '#F3150A');
                offsetIndex++;
              }

              // c) Rotten potato => green
              for (let i = 0; i < wastedPotatoCount; i++) {
                const offsetY = -10 * offsetIndex;
                drawColoredPotato(p5, centerX, centerY + offsetY - 10, '#33cc33');
                offsetIndex++;
              }
            }
          }
        }
        else {
          // If not fishingrod / icebox / cashregister / potato_seed => optionally debug-draw inventory
          if (tile.inventory) {
            const items = Object.keys(tile.inventory.items);
            if (items.length > 0) {
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const count = tile.inventory.items[item];
                p5.fill(0);
                p5.text(
                  `${count} ${item}`,
                  col * tileSize,
                  row * tileSize + i * 25
                );
              }
            }
          }
        }

        // 4) Show supply price if tile is fishingrod / icebox / cashregister / potato_seed
        if (
          tileType === 'fishingrod' ||
          tileType === 'icebox'     ||
          tileType === 'cashregister' ||
          tileType === 'potato_seed'
        ) {
          const supplyComp = world.getComponent(tile.claimed, 'Supply');
          if (supplyComp) {
            p5.fill(0);
            p5.textSize(12);
            p5.text(
              `$${supplyComp.reservationPrice}`,
              col * tileSize,
              row * tileSize - tileSize / 4
            );
          }
        }

        // 5) If tile is red_carpet & locked to a consumer => show consumer's name & price
        if (tileType === 'red_carpet') {
          if (tile.lockedDemand != null) {
            const demComp = world.getComponent(tile.lockedDemand, 'Demand');
            if (demComp) {
              // Attempt to find the consumer's Name component
              const nameComp = world.getComponent(tile.lockedDemand, 'Name');

              // We'll center the text horizontally, and place the name above the price
              p5.push();
              p5.fill('black');
              p5.textSize(7);
              p5.textAlign(p5.CENTER);

              const centerX = col * tileSize + tileSize / 2;
              const nameY = row * tileSize - tileSize * 0.3;
              const priceY = nameY + 10;

              // (A) Draw the Name, if we have it
              if (nameComp && nameComp.firstName) {
                p5.text(nameComp.firstName, centerX, nameY);
              }
              // (B) Draw the Price just below
              p5.text(`$${demComp.reservationPrice}`, centerX, priceY);
              p5.pop();
            }
          }
        }

        // 6) Forest logic for regrowing + wobbly tree
        if (tileType === 'forest') {
          if (!tile.hasTree && p5.millis() > tile.regenTime) {
            tile.hasTree = true;
          }
          if (tile.hasTree) {
            const now = p5.millis();
            const isWobbling = tile.wobbleEndTime && tile.wobbleEndTime > now;
            if (isWobbling) {
              p5.push();
              const offsetX = col * tileSize + tileSize / 2;
              const offsetY = row * tileSize + tileSize;
              p5.translate(offsetX, offsetY);
              p5.rotate(p5.sin(now * 0.02) * 0.1);
              p5.translate(-offsetX, -offsetY);
            }
            p5.fill('#877555');
            const trunkWidth = tileSize / 8;
            const trunkHeight = tileSize / 2;
            const trunkX = col * tileSize + tileSize / 2 - trunkWidth / 2;
            const trunkY = row * tileSize + tileSize - trunkHeight;
            p5.rect(trunkX, trunkY, trunkWidth, trunkHeight);

            // pine shape
            p5.fill('#397A2B');
            const centerX = col * tileSize + tileSize / 2;
            const baseY = trunkY;
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
