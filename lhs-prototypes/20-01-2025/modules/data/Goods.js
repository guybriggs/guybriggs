// modules/data/Goods.js

export const Goods = {
  FISH: 'fish',
  FISH_WORK: 'fish_work',
  ASSISTANT_WORK: 'assistant_work',
  WOOD: 'wood',
  STONE: 'stone',
  BRICK: 'brick',
};

export function registerGood(key, value) {
  Goods[key] = value;
}

export function getRandomGood() {
  const goodsArray = Object.values(Goods);
  return goodsArray[Math.floor(Math.random() * goodsArray.length)];
}
