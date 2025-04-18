// modules/utils/WindDamageUtils.js
export function applyWindDamage(tile, row, col, tileMap) {
    if(tile.type === 'wall' || tile.type === 'floor') {
      tile.damage = (tile.damage || 0) + 1;
      if(tile.damage > 300) {
        tileMap[row][col] = { type: 'grassland', hasTree: false, regenTime: 0 };
      }
    }
  }
  