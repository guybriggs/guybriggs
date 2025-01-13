// modules/data/Goods.js

/**
 * Enumeration of available goods in the game.
 */
export const Goods = Object.freeze({
    CARROTS: 'Carrots',
    FISH: 'Fish',
    // Add more goods as needed
  });
  
  /**
   * Utility function to get a random good.
   * @returns {string} A random good from the Goods enumeration.
   */
  export function getRandomGood() {
    const goodsArray = Object.values(Goods);
    return goodsArray[Math.floor(Math.random() * goodsArray.length)];
  }
  