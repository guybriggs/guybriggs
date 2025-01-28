// modules/systems/TreeInteractionSystem.js
import { tileSize, mapRows, mapCols, tileMap } from '../tile/TileMap.js';

export class TreeInteractionSystem {
  constructor(regenDelay = 5000) {
    this.regenDelay = regenDelay;
  }
  
  update(world, playerEntity) {
    const pos = world.getComponent(playerEntity, 'Position');
    if(!pos) return;
    const col = Math.floor(pos.x / tileSize);
    const row = Math.floor(pos.y / tileSize);
    if(row < 0 || row >= mapRows || col < 0 || col >= mapCols) return;
    let tile = tileMap[row][col];
    if(tile.type === 'forest' && tile.hasTree) {
      tile.hasTree = false;
      tile.regenTime = millis() + this.regenDelay;
    }
  }
}
