// modules/components/MovementCooldown.js
export function MovementCooldownComponent(duration = 120) { // duration in frames (e.g., 120 frames = 2 seconds at 60fps)
    return {
      remaining: duration,
      duration,
    };
  }
  