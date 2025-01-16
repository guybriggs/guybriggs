// modules/systems/SittingRenderSystem.js

export class SittingRenderSystem {
    constructor() {}
  
    update(world, p5) {
      world.entities.forEach(entity => {
        const sitting = world.getComponent(entity, 'Sitting');
        const position = world.getComponent(entity, 'Position');
        const renderable = world.getComponent(entity, 'Renderable');
        const name = world.getComponent(entity, 'Name');
  
        if (sitting && position && renderable && name) {
          p5.fill('red'); // Different color for sitting agents
          p5.noStroke();
          p5.circle(position.x, position.y, renderable.radius || 10);
  
          // Draw name above the agent
          p5.fill(0);
          p5.textAlign(p5.CENTER, p5.BOTTOM);
          p5.text(name.firstName, position.x, position.y - (renderable.radius || 10) - 5);
        }
      });
    }
  }
  