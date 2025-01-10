// modules/systems/InputSystem.js
export class InputSystem {
    update(world, playerEntity, speed = 3) {
      const velocity = world.getComponent(playerEntity, 'Velocity');
      if(!velocity) return;
      velocity.vx = 0;
      velocity.vy = 0;
      if(keyIsDown(LEFT_ARROW))  velocity.vx = -speed;
      if(keyIsDown(RIGHT_ARROW)) velocity.vx = speed;
      if(keyIsDown(UP_ARROW))    velocity.vy = -speed;
      if(keyIsDown(DOWN_ARROW))  velocity.vy = speed;
    }
  }
  