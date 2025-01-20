// modules/core/World.js
export class World {
  constructor() {
    this.nextEntityId = 1;
    this.entities = new Set();
    this.components = new Map();
  }

  createEntity() {
    const id = this.nextEntityId++;
    this.entities.add(id);
    return id;
  }

  addComponent(entity, componentName, data) {
    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
    }
    this.components.get(componentName).set(entity, data);
  }

  removeComponent(entity, componentName) {
    const compStore = this.components.get(componentName);
    if (compStore) compStore.delete(entity);
  }

  getComponent(entity, componentName) {
    const compStore = this.components.get(componentName);
    return compStore ? compStore.get(entity) : undefined;
  }

  hasComponent(entity, ...componentNames) {
    for (const name of componentNames) {
      const compStore = this.components.get(name);
      if (!compStore || !compStore.has(entity)) {
        return false;
      }
    }
    return true;
  }

  getEntitiesWith(...componentNames) {
    const sets = componentNames.map(name => {
      const compStore = this.components.get(name);
      return compStore ? new Set(compStore.keys()) : new Set();
    });
    const [firstSet, ...others] = sets;
    return [...firstSet].filter(entity => others.every(set => set.has(entity)));
  }

  getEntitiesByComponent(...componentNames) {
    const sets = componentNames.map(name => {
      const compStore = this.components.get(name);
      return compStore ? new Set(compStore.keys()) : new Set();
    });
    const [firstSet, ...others] = sets;
    return [...firstSet].filter(entity => others.every(set => set.has(entity)));
  }

  /**
   * Retrieves all entities that have **all** of the specified components.
   * @param {string[]} componentNames - Array of component name strings.
   * @returns {number[]} Array of entity IDs.
   */
  getEntitiesByComponents(componentNames) {
    if (!Array.isArray(componentNames) || componentNames.length === 0) {
      console.warn('getEntitiesByComponents: componentNames should be a non-empty array.');
      return [];
    }

    // Retrieve sets of entities for each component
    const componentEntitySets = componentNames.map(name => {
      const compStore = this.components.get(name);
      return compStore ? new Set(compStore.keys()) : new Set();
    });

    // If any component has no entities, return empty array early
    if (componentEntitySets.some(set => set.size === 0)) {
      return [];
    }

    // Sort sets by size to optimize intersection performance
    componentEntitySets.sort((a, b) => a.size - b.size);

    // Start with the smallest set
    const [smallestSet, ...otherSets] = componentEntitySets;

    // Filter entities that are present in all other sets
    const result = [...smallestSet].filter(entity =>
      otherSets.every(set => set.has(entity))
    );

    return result;
  }
}
