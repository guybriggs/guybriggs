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

  getEntitiesWith(...componentNames) {
    const sets = componentNames.map(name => {
      const compStore = this.components.get(name);
      return compStore ? new Set(compStore.keys()) : new Set();
    });
    const [firstSet, ...others] = sets;
    return [...firstSet].filter(entity => others.every(set => set.has(entity)));
  }
}
