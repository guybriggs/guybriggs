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

        // 1) Fill tile color
        fill(colorForTileType(tile.type));
        // Expand rect slightly to avoid visual seams
        rect(col * tileSize - 1, row * tileSize - 1, tileSize + 2, tileSize + 2);

        // 2) If it's a door tile, optionally draw a small handle
        if (tile.type === 'door_tile') {
          push();
          fill(40);  // a darker color for the knob
          // Position a small rectangle or ellipse as a "handle"
          let knobX = col * tileSize + tileSize - 6;  // near right edge
          let knobY = row * tileSize + tileSize/2;
          rect(knobX, knobY - 3, 3, 6); 
          pop();
        }

        // 3) Grassland patch of grass
        if (tile.type === 'grassland') {
          push();
          fill(34, 170, 50);
          let gx = col * tileSize + tileSize/2;
          let gy = row * tileSize + tileSize - 6;
          triangle(gx, gy, gx - 3, gy + 6, gx + 3, gy + 6);
          pop();
        }

        // 4) Forest & tree logic (unchanged)
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
            fill(139, 69, 19);
            let trunkWidth = tileSize / 8;
            let trunkHeight = tileSize / 2;
            let trunkX = col * tileSize + tileSize/2 - trunkWidth/2;
            let trunkY = row * tileSize + tileSize - trunkHeight;
            rect(trunkX, trunkY, trunkWidth, trunkHeight);

            // pine shape
            fill(34, 120, 20);
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
