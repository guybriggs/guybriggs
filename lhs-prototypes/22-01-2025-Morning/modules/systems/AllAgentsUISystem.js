// modules/systems/AllAgentsUISystem.js

import { log } from "../utils/ExchangeMoney.js";

export class AllAgentsUISystem {
  constructor() {
    this.enabled = true; // Start enabled by default
    this.fontSize = 20;
    this.spacing = 100;
    this.fill = 0;
  }

  // Optionally, a method to toggle on/off
  toggle() {
    this.enabled = !this.enabled;
  }

  update(p5, world) {
    // Only run if enabled
    if (!this.enabled) {
      return;
    }

    const entities = world.getEntitiesWith('Name');
    let index = 0;
    let worldTotalMoney = 0;

    for (const entity of entities) {
      const pos = world.getComponent(entity, 'Position');
      const vel = world.getComponent(entity, 'Velocity');
      const waiting = world.getComponent(entity, 'Waiting');
      const renderable = world.getComponent(entity, 'Renderable');
      const name = world.getComponent(entity, 'Name');
      const emotion = world.getComponent(entity, 'Emotion');
      const demand = world.getComponent(entity, 'Demand');
      const supply = world.getComponent(entity, 'Supply');
      const job = world.getComponent(entity, 'Job');
      const inventory = world.getComponent(entity, 'Inventory');
      const follower = world.getComponent(entity, 'Follower');
      const money = world.getComponent(entity, 'Money');

      p5.push();
      p5.noStroke();
      p5.textAlign(p5.LEFT, p5.CENTER);
      p5.textSize(this.fontSize);
      p5.fill(this.fill);

      // First column: Name
      p5.text(name.firstName, 0, this.spacing + index * this.fontSize);

      // Second column: Money (omit if follower)
      if (money) {
        const moneyString = follower ? '' : '$' + money.amount.toFixed(0);
        p5.text(moneyString, this.spacing * 2, this.spacing + index * this.fontSize);
      }

      // Third/fourth columns: supply or demand (S: / D:) and the good
      // Price is now spaced further at column 5, quantity at column 6
      if (supply || demand) {
        let entry = supply ? supply : demand;
        let prefix = supply ? 'S: ' : 'D: ';
        // If for some reason both supply & demand exist, highlight in red
        if (supply && demand) p5.fill(255, 0, 0);

        // Supply/demand label
        p5.text(prefix + entry.good, this.spacing * 3, this.spacing + index * this.fontSize);
        // Price with an extra gap
        p5.text('$' + entry.reservationPrice, this.spacing * 5, this.spacing + index * this.fontSize);
        // Quantity
        p5.text(entry.quantity, this.spacing * 6, this.spacing + index * this.fontSize);
      }

      // Inventory columns (if any)
      if (inventory) {
        let invArr = Object.keys(inventory.items);
        // Start after column 6 => push further to column 7
        for (let i = 0; i < invArr.length; i++) {
          p5.text(
            invArr[i] + ' ' + inventory.items[invArr[i]],
            this.spacing * 7 + i * this.spacing,  // now starts at column 7
            this.spacing + index * this.fontSize
          );
        }
      }

      p5.pop();

      // If not a follower => add money to total
      if (!follower && money) {
        worldTotalMoney += money.amount;
      }

      index++;
    }

    // At the end, display total money and instructions
    p5.push();
    p5.noStroke();
    p5.textAlign(p5.LEFT, p5.CENTER);
    p5.textSize(this.fontSize);
    p5.fill(this.fill);

    p5.text(
      'World Total Money: $' + worldTotalMoney.toFixed(0),
      this.spacing,
      this.spacing + index * this.fontSize
    );
    index++;

    p5.text(
      'Toggle visibility with Q',
      this.spacing,
      this.spacing + index * this.fontSize
    );
    index++;
    p5.pop();

    // And the exchange money log
    p5.push();
    p5.noStroke();
    p5.textAlign(p5.LEFT, p5.CENTER);
    p5.textSize(this.fontSize/2);
    p5.fill(this.fill);
    for (let i = 0; i < log.length; i++) {
      p5.text(
        log[i],
        0,
        this.spacing + index * this.fontSize + i * this.fontSize/2
      );
    }
    p5.pop();
  }
}
