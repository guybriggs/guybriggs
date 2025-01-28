import { ParticleComponent } from '../components/Particle.js';
import { getEmotionColor } from '../components/Emotion.js';

export class AgentParticleEmitterSystem {
  update(world) {
    const agents = world.getEntitiesWith('Name', 'Position');
    for (let agent of agents) {
      const pos = world.getComponent(agent, 'Position');
      if (!pos) continue;
      
      // Determine random direction and speed
      const angle = random(0, TWO_PI);
      const speed = random(0.5/2, 1.5/2);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      // Create a new particle entity
      const particle = world.createEntity();
      world.addComponent(particle, 'Position', { x: pos.x, y: pos.y });
      world.addComponent(particle, 'Velocity', { vx, vy });
      const emotion = world.getComponent(agent, 'Emotion');
      world.addComponent(particle, 'Particle', ParticleComponent({
        lifespan: 500,
        color: getEmotionColor(emotion.type),
        size: 2
      }));
    }
  }
}
