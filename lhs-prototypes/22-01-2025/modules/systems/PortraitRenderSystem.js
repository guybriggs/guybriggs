// modules/systems/PortraitRenderSystem.js

export class PortraitRenderSystem {
  constructor() {
    this.iconWidth = 40;
    this.iconHeight = 40;
    this.x = 10;  // top-left corner
    this.y = 10;
    this.utilityValue = 0;  // We'll store utility here as an example
  }

  setUtility(val) {
    this.utilityValue = val;
  }

  update(p5, world) {
    // 1) Draw a simple portrait icon
    p5.push();
    const iconCenterX = this.x + this.iconWidth / 2;
    const iconCenterY = this.y + this.iconHeight / 2;
    p5.noStroke();
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(24);
    p5.text('👨‍🦱', iconCenterX, iconCenterY);
    p5.pop();

    // 2) Retrieve money & reputation from world, draw stats
    p5.push();
    const statsX = this.x + this.iconWidth + 5;
    const statsY = this.y;
    p5.fill(255);
    p5.textSize(14);
    p5.textFont('Arial');

    // Find money from ECS
    const moneyEntities = world.getEntitiesWith('Money');
    let moneyVal = 0;
    if (moneyEntities.length > 0) {
      const mComp = world.getComponent(moneyEntities[0], 'Money');
      moneyVal = mComp.amount;
    }

    // If we haven't set world.reputation, default to 0
    let repVal = world.reputation || 0;

    p5.text(`Utility: ${this.utilityValue}`, statsX, statsY + 14);
    p5.text(`Money:  $${moneyVal}`, statsX, statsY + 30);
    p5.text(`Reputation: ${repVal}`, statsX, statsY + 46);

    p5.pop();
  }
}
