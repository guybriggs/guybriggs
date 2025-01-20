import { tileMap, tileSize, mapRows, mapCols } from '../tile/TileMap.js';

export class FoodDecaySystem {
  /**
   * @param {number} rotTime - How many seconds until items rot. Default = 10.
   */
  constructor(rotTime = 10) {
    this.rotTime = rotTime; // Items become wasted after 10 seconds
    // We'll track each tile's item timers in a 2D array.
    // itemTimers[r][c][itemName] = elapsedTime in seconds.
    this.itemTimers = [];
    // Track the count of wasted items in a separate 2D array
    // decayedItems[r][c][wastedItemName] = number of wasted items recorded.
    this.decayedItems = [];

    // Initialize the 2D arrays
    for (let r = 0; r < mapRows; r++) {
      this.itemTimers[r] = [];
      this.decayedItems[r] = [];
      for (let c = 0; c < mapCols; c++) {
        this.itemTimers[r][c] = {};
        this.decayedItems[r][c] = {};
      }
    }
  }

  /**
   * Call this each frame to update timers and handle rotting.
   * @param {World} world - (Not strictly needed for tile-based decay,
   *                        but kept for consistency with your ECS.)
   * @param {number} deltaTime - The time elapsed since last frame (ms).
   */
  update(world, deltaTime) {
    // Convert deltaTime to seconds
    const dtSeconds = deltaTime / 1000;

    // Loop through every tile in the map
    for (let r = 0; r < mapRows; r++) {
      for (let c = 0; c < mapCols; c++) {
        const tile = tileMap[r][c];

        if (tile.type == 'icebox') continue; // Things don't rot in the icebox!!

        const inventory = tile.inventory;
        if (!inventory) continue;

        // For each item in this tile's inventory...
        for (const itemName in inventory.items) {
          // Skip non-food items
          if (!this.isFoodItem(itemName)) {
            // You might optionally clear timers for non-food items
            // delete this.itemTimers[r][c][itemName];
            continue;
          }

          // 1) Update the timer for this food item
          const currentTimer = this.itemTimers[r][c][itemName] || 0;
          const newTimer = currentTimer + dtSeconds;
          this.itemTimers[r][c][itemName] = newTimer;

          // 2) Check if it exceeds the rot threshold
          if (newTimer >= this.rotTime) {
            // All items of 'itemName' on this tile become wasted
            const count = inventory.items[itemName];
            const wastedName = 'wasted_' + itemName;

            if (!inventory.hasItem(itemName)) return;

            // Remove the fresh items
            inventory.removeItem(itemName, count);
            // Add the wasted version
            inventory.addItem(wastedName, count);

            // Reset or remove the timer for the fresh item
            // so it doesn't keep rotting something that is gone
            delete this.itemTimers[r][c][itemName];

            // Update our decayedItems array to reflect that we have more wasted items
            const currentWastedCount = this.decayedItems[r][c][wastedName] || 0;
            this.decayedItems[r][c][wastedName] = currentWastedCount + count;
          }
        }

        // 3) Now ensure the decayedItems array matches the actual inventory
        //    for each wasted item name in THIS tile
        for (const wastedItemName of Object.keys(this.decayedItems[r][c])) {
          const realCount = inventory.items[wastedItemName] || 0;
          if (this.decayedItems[r][c][wastedItemName] !== realCount) {
            // Fix the decayed array so it matches reality
            this.decayedItems[r][c][wastedItemName] = realCount;
          }
        }
      }
    }
  }

  /**
   * Simple helper to decide if the item is "food."
   * Replace with your own item database or tagging approach if desired.
   */
  isFoodItem(itemName) {
    const foodItems = ['apple', 'bread', 'meat', 'berries', 'fish'];
    return foodItems.includes(itemName.toLowerCase());
  }
}
