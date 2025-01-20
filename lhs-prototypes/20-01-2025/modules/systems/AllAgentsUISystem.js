// modules/systems/AllAgentsUISystem.js

export class AllAgentsUISystem {
  constructor() {
    this.enabled = true; // Start enabled by default
    this.fontSize = 12;
    this.spacing = 50;
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
      p5.textSize(this.fontSize);
      p5.fill(this.spacing);
      p5.text(name.firstName, 0, this.spacing + index * this.fontSize);

      if (money) {
        const string = follower ? '' : '$' + money.amount;
        p5.text(string, this.spacing*2, this.spacing + index * this.fontSize);
      }

      if (supply || demand) {
        let entry = supply ? supply : demand;
        let string = supply ? 'S: ' : 'D: ';
        p5.text(string + entry.good, this.spacing*3, this.spacing + index * this.fontSize);
        p5.text('$' + entry.reservationPrice, this.spacing*4, this.spacing + index * this.fontSize);
        p5.text(entry.quantity, this.spacing*5, this.spacing + index * this.fontSize);
      }

      if (inventory) {
        let invArr = Object.keys(inventory.items);
        for (let i = 0; i < invArr.length; i++) {
          p5.text(invArr[i] + ' ' + inventory.items[invArr[i]],
            this.spacing*6 + i * this.spacing, this.spacing + index * this.fontSize);
        }
      }
      p5.pop();

      if (!follower) worldTotalMoney += money.amount;
      index++;
    }

    p5.push();
    p5.noStroke();
    p5.textAlign(p5.LEFT, p5.CENTER);
    p5.textSize(this.fontSize);
    p5.fill(this.spacing);
    p5.text('World Total Money: $' + worldTotalMoney, this.spacing, this.spacing + index * this.fontSize);
    index++;
    p5.text('Toggle visibility with Q', this.spacing, this.spacing + index * this.fontSize);
    p5.pop();
  }
}
