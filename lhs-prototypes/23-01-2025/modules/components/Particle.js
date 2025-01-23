export function ParticleComponent(data = {}) {
    return {
      age: 0,
      lifespan: data.lifespan || 1000,  // lifespan in milliseconds
      color: data.color || 'yellow',
      size: data.size || 4,
      alpha: 255
    };
  }
  