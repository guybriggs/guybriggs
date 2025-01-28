// modules/systems/TileParticleEmitterSystem.js

import { ParticleComponent } from '../components/Particle.js';
import { tileMap, tileSize } from '../tile/TileMap.js';

export class TileParticleEmitterSystem {
  constructor(world) {
    this.world = world;
    this.particleLifetime = 60; // Lifetime of particles in frames
  }

  update() {
    // Iterate through all tiles and emit particles if they are heaters
    for (let row = 0; row < tileMap.length; row++) {
      for (let col = 0; col < tileMap[row].length; col++) {
        const tile = tileMap[row][col];
        if (tile.type === 'heater') {
          this.emitParticles(col, row);
        }
      }
    }
  }

  emitParticles(col, row) {
    const tileCenterX = col * tileSize + tileSize / 2;
    const tileCenterY = row * tileSize + tileSize / 2;
    const angle = random(0, TWO_PI);
    const speed = random(0.5, 1.5);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed / 2;

    // Emit a few particles per frame
    // Create a new particle entity
    const particle = this.world.createEntity();
    this.world.addComponent(particle, 'Position', { x: tileCenterX, y: tileCenterY });
    this.world.addComponent(particle, 'Velocity', { vx, vy });
    this.world.addComponent(particle, 'Particle', ParticleComponent({
    lifespan: 2000,
    color: 'orangered',
    size: 3
    }));
  }
}
