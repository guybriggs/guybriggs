export class ParticleRenderSystem {
    update(world, p5) {
      const particles = world.getEntitiesWith('Particle', 'Position');
      for (let entity of particles) {
        const pos = world.getComponent(entity, 'Position');
        const particle = world.getComponent(entity, 'Particle');
        if (!pos || !particle) continue;
        p5.push();
        p5.noStroke();
        // Create a p5.Color object from the particle's color string
        let col = p5.color(particle.color);
        // Set the alpha based on the particle's alpha property
        col.setAlpha(particle.alpha);
        p5.fill(col);
        p5.ellipse(pos.x, pos.y, particle.size, particle.size);
        p5.pop();
      }
    }
  }