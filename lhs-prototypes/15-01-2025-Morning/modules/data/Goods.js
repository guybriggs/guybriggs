// modules/data/Goods.js

/**
 * Enumeration of available goods in the game.
 */
// data/Goods.js

export const Goods = {
  FISH: 'fish',
  WOOD: 'wood',
  STONE: 'stone',
  // Mods can add new goods like:
  // IRON: 'iron',
  // GOLD: 'gold',
};

export function registerGood(key, value) {
  Goods[key] = value;
}

export function getRandomGood() {
  const goodsArray = Object.values(Goods);
  return goodsArray[Math.floor(Math.random() * goodsArray.length)];
}
  