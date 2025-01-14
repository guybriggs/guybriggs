// modules/components/Inventory.js

export function InventoryComponent(initialItems = {}) {
    return { items: { ...initialItems } };
  }
  