import { tileMap, tileSize } from '../tile/TileMap.js';

export class DamageRenderSystem {
  update(p5) {
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        const tile = tileMap[r][c];
        if ((tile.type === 'white_bricks' || tile.type === 'dark_floor') && tile.damage) {
          p5.push();
          // Dark stroke with opacity based on damage
          p5.stroke(50, 50, 50, Math.min(tile.damage * 5, 255));
          // Draw several crooked lines proportional to damage
          for (let i = 0; i < tile.damage; i++) {
            const x = c * tileSize;
            const y = r * tileSize;
            const startX = x + p5.random(tileSize);
            const startY = y + p5.random(tileSize);
            const endX = startX + p5.random(-tileSize/4, tileSize/4);
            const endY = startY + p5.random(-tileSize/4, tileSize/4);
            p5.line(startX, startY, endX, endY);
          }
          p5.pop();
        }
      }
    }
  }
}
