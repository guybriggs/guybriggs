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
      if (!this.items[item]) {
        throw new Error(`Item "${item}" does not exist in inventory`);
      }
      this.items[item] -= amount;
      if (this.items[item] <= 0) {
        delete this.items[item];
      }
    },

    // Check if an item exists in the inventory
    hasItem(item) {
      return !!this.items[item];
    },

    // Get the quantity of an item
    getItemCount(item) {
      return this.items[item] || 0;
    },
  };
}