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

    // Handle numeric keys 1-9 for card selection
    for (let n = 1; n <= 9; n++) {
      // Check if the key is pressed
      if (keyIsDown(48 + n)) { // Key codes for '1'-'9' are 49-57
        const idx = n - 1;
        const cardSys = this.cardSystem;
        // Ensure index is within bounds of cards array
        if (idx < cardSys.cards.length) {
          const card = cardSys.cards[idx];
          // Toggle selection logic
          cardSys.selectedCardType = card.type;
          cardSys.wobbleFrame = 10;
        }
      }
    }
  }
}
