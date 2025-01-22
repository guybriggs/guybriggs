// modules/components/WindArrow.js
export function WindArrowComponent(data = {}) {
    return {
      // Position & Velocity come from other ECS components (e.g. "Position", "Velocity")
      // We'll store arrow-specific settings here:
      lifetime: data.lifetime || 3000,   // total lifespan (ms)
      fadeDuration: data.fadeDuration || 500, // fade in/out time (ms)
      age: 0, // how long it’s been alive (ms)
      alpha: 0,  // current transparency (0..255)
      maxAlpha: 255,
      size: data.size || 10,  // half-length of arrow
      rotation: data.rotation || 0,  // angle in radians or degrees
    };
  }
  