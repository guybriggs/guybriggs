// modules/systems/RenderSystem.js
export class RenderSystem {
  update(world) {
    const entities = world.getEntitiesWith('Position', 'Renderable');
    for (const entity of entities) {
      const pos = world.getComponent(entity, 'Position');
      const ren = world.getComponent(entity, 'Renderable');
      fill(ren.color);
      noStroke();
      ellipse(pos.x, pos.y, ren.radius * 2, ren.radius * 2);
    }
  }
}
