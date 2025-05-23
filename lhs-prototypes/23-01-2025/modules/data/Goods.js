// modules/data/Goods.js

export const Goods = {
  FISH: 'fish',
  FISH_WORK: 'fisherman',
  ASSISTANT_WORK: 'assistant',
  WOOD: 'wood',
  STONE: 'stone',
  BRICK: 'brick',
  POTATO: 'potato',
  FARM_WORK: 'farmer',
};

export function registerGood(key, value) {
  Goods[key] = value;
}

export function getRandomGood() {
  const goodsArray = Object.values(Goods);
  return goodsArray[Math.floor(Math.random() * goodsArray.length)];
}
