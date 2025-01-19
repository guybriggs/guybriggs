// modules/systems/AllAgentsUISystem.js

export class AllAgentsUISystem {
  constructor() {
    this.enabled = true; // Start enabled by default
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

    // All your existing code:
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
      p5.textSize(24);
      p5.text(name.firstName, 100, 100 + index * 24);

      if (money) {
        p5.text('$' + money.amount, 200, 100 + index * 24);
        if (follower) {
          p5.text('——', 200, 100 + index * 24);
        }
      }

      if (supply || demand) {
        let entry = supply ? supply : demand;
        let string = supply ? 'S: ' : 'D: ';
        p5.text(string + entry.good, 300, 100 + index * 24);
        p5.text('$' + entry.reservationPrice, 400, 100 + index * 24);
        p5.text(entry.quantity, 500, 100 + index * 24);
      }

      if (inventory) {
        let invArr = Object.keys(inventory.items);
        for (let i = 0; i < invArr.length; i++) {
          p5.text(invArr[i] + ' ' + inventory.items[invArr[i]],
                  600 + i * 100, 100 + index * 24);
        }
      }
      p5.pop();

      if (!follower) worldTotalMoney += money.amount;
      index++;
    }

    p5.push();
    p5.noStroke();
    p5.textAlign(p5.LEFT, p5.CENTER);
    p5.textSize(24);
    p5.text('World Total Money: $' + worldTotalMoney, 100, 100 + index * 24);
    index++;
    p5.text('Toggle visibility with Q', 100, 100 + index * 24);
    p5.pop();
  }
}
