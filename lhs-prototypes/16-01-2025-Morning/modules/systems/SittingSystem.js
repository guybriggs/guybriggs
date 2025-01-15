// modules/systems/SittingSystem.js

export class SittingSystem {
    constructor() {}
  
    update(world) {
      world.entities.forEach(entity => {
        const sitting = world.getComponent(entity, 'Sitting');
        const velocity = world.getComponent(entity, 'Velocity');
  
        if (sitting && velocity) {
          // Ensure velocity is zero
          velocity.vx = 0;
          velocity.vy = 0;
          world.addComponent(entity, 'Velocity', velocity);
        }
      });
    }
  }
  