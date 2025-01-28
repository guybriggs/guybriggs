// modules/systems/InputSystem.js

export class InputSystem {
  constructor(cardSystem) {
    this.cardSystem = cardSystem;
  }

  update(world, playerEntity, speed = 3) {
    const velocity = world.getComponent(playerEntity, 'Velocity');
    if (!velocity) return;

    // Reset velocity each frame
    velocity.vx = 0;
    velocity.vy = 0;

    // Movement keys: W, A, S, D
    if (keyIsDown(87)) velocity.vy = -speed; // W
    if (keyIsDown(83)) velocity.vy = speed;  // S
    if (keyIsDown(65)) velocity.vx = -speed; // A
    if (keyIsDown(68)) velocity.vx = speed;  // D

    // --- Press '1' - '8' to quick-select deck cards
    for (let n = 1; n <= 8; n++) {
      if (keyIsDown(48 + n)) {
        const idx = n - 1;
        if (idx < this.cardSystem.cards.length) {
          const card = this.cardSystem.cards[idx];
          this.cardSystem.selectedCardType = card.type;
          this.cardSystem.wobbleFrame = 10;
        }
      }
    }

    // --- Press '9' => Increase card UI scale
    if (keyIsDown(57)) { // code for '9'
      this.cardSystem.increaseUIScale(0.1); // increase 10%
    }
  }
}
