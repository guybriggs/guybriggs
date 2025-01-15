// modules/systems/InputSystem.js
export class InputSystem {
  update(world, playerEntity, speed = 3) {
    const velocity = world.getComponent(playerEntity, 'Velocity');
    if (!velocity) return;

    // Reset velocity each frame
    velocity.vx = 0;
    velocity.vy = 0;

    // W (87)
    if (keyIsDown(87)) { 
      velocity.vy = -speed; 
    }
    // S (83)
    if (keyIsDown(83)) { 
      velocity.vy = speed; 
    }
    // A (65)
    if (keyIsDown(65)) { 
      velocity.vx = -speed; 
    }
    // D (68)
    if (keyIsDown(68)) { 
      velocity.vx = speed; 
    }
  }
}