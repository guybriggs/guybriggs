import { tileMap, tileSize, mapRows, mapCols } from '../tile/TileMap.js';

export class FoodDecaySystem {
  /**
   * @param {number} rotTime - How many seconds until items rot. Default = 20.
   */
  constructor(rotTime = 20) {
    this.rotTime = rotTime; // Items become wasted after 20 seconds by default.
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

        // Things don't rot in the icebox
        if (tile.type === 'icebox') continue;

        const inventory = tile.inventory;
        if (!inventory) continue;

        // For each item in this tile's inventory...
        for (const itemName in inventory.items) {
          // Skip non-food items entirely
          if (!this.isFoodItem(itemName)) {
            // Optionally clear timers for non-food items:
            // delete this.itemTimers[r][c][itemName];
            continue;
          }

          // (A) Decide how quickly this item accumulates "decay time"
          //     If it's potato => half speed.
          let dtForItem = dtSeconds;
          if (itemName.toLowerCase() === 'potato') {
            dtForItem = dtSeconds / 2;  // half-speed decay for potatoes
          }

          // (B) Update the decay timer for this item
          const currentTimer = this.itemTimers[r][c][itemName] || 0;
          const newTimer = currentTimer + dtForItem;
          this.itemTimers[r][c][itemName] = newTimer;

          // (C) Check if it exceeds the rot threshold => become wasted_XXX
          if (newTimer >= this.rotTime) {
            // All of this item becomes wasted
            const count = inventory.items[itemName];
            const wastedName = 'wasted_' + itemName;

            if (!inventory.hasItem(itemName)) return;

            // Remove fresh items, add wasted items.
            inventory.removeItem(itemName, count);
            inventory.addItem(wastedName, count);

            // Reset timer for that fresh item type so it won't keep rotting.
            delete this.itemTimers[r][c][itemName];

            // Update decayedItems for this tile so it matches reality.
            const currentWastedCount = this.decayedItems[r][c][wastedName] || 0;
            this.decayedItems[r][c][wastedName] = currentWastedCount + count;
          }
        }

        // 3) Match decayedItems array to actual inventory for wasted items.
        for (const wastedItemName of Object.keys(this.decayedItems[r][c])) {
          const realCount = inventory.items[wastedItemName] || 0;
          if (this.decayedItems[r][c][wastedItemName] !== realCount) {
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
    const foodItems = ['apple', 'bread', 'meat', 'berries', 'fish', 'potato'];
    return foodItems.includes(itemName.toLowerCase());
  }
}
