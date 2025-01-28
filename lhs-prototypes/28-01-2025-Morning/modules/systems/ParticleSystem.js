import { ParticleComponent } from '../components/Particle.js';

export class ParticleSystem {
  update(world, dt) {
    const particles = world.getEntitiesWith('Particle', 'Position', 'Velocity');
    for (let entity of particles) {
      const particle = world.getComponent(entity, 'Particle');
      particle.age += dt;
      if (particle.age > particle.lifespan) {
        // Remove the particle from the world
        world.entities.delete(entity);
        for (let [compName, compMap] of world.components) {
          compMap.delete(entity);
        }
        continue;
      }
      // Update transparency based on age
      particle.alpha = map(particle.age, 0, particle.lifespan, 255, 0);
    }
  }
}
