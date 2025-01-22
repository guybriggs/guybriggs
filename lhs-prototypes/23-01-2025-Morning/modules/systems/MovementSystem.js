// modules/systems/MovementSystem.js
export class MovementSystem {
  update(world) {
    const entities = world.getEntitiesWith('Position', 'Velocity');
    for (const entity of entities) {
      const position = world.getComponent(entity, 'Position');
      const velocity = world.getComponent(entity, 'Velocity');
      
      position.x += velocity.vx;
      position.y += velocity.vy;
      
      // Optional: constrain within world boundaries if desired
    }
  }
}
