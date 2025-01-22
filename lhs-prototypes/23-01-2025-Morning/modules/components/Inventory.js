// modules/components/Inventory.js

export function InventoryComponent(initialItems = {}) {
  return {
    items: { ...initialItems },

    // Add an item to the inventory
    addItem(item, amount) {
      if (!item || amount <= 0) {
        throw new Error("Invalid item or amount");
      }
      this.items[item] = (this.items[item] || 0) + amount;
    },

    // Remove an item from the inventory
    removeItem(item, amount) {
      if (!item || amount <= 0) {
        throw new Error("Invalid item or amount");
      }
      // Initialize the item count to 0 if it doesn't exist, then subtract the amount
      this.items[item] = (this.items[item] || 0) - amount;
      // Note: We no longer delete the item when its count is <= 0,
      // allowing negative counts.
    },

    // Check if an item exists in the inventory
    hasItem(item) {
      return this.items[item] !== undefined && this.items[item] > 0;
    },

    // Get the quantity of an item
    getItemCount(item) {
      // This will return a negative count if the item has been removed beyond 0
      return this.items[item] || 0;
    },
  };
}
