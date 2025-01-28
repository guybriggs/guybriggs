// modules/systems/PortraitRenderSystem.js

export class PortraitRenderSystem {
  constructor() {
    this.iconWidth = 40;
    this.iconHeight = 40;
    this.x = 10;  
    this.y = 10;
    // remove `utilityValue` since we will read it from ECS
  }

  update(p5, world) {
    // (1) draw the portrait icon
    p5.push();
    const iconCenterX = this.x + this.iconWidth / 2;
    const iconCenterY = this.y + this.iconHeight / 2;
    p5.noStroke();
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(24);
    p5.text('👨‍🦱', iconCenterX, iconCenterY);
    p5.pop();

    // (2) Retrieve money & utility & rep
    p5.push();
    const statsX = this.x + this.iconWidth + 5;
    const statsY = this.y;
    p5.fill(255);
    p5.textSize(14);
    p5.textFont('Arial');

    // Find money from ECS (same as you had)
    let moneyVal = 0;
    const moneyEntities = world.getEntitiesWith('Money');
    if (moneyEntities.length > 0) {
      const mComp = world.getComponent(moneyEntities[0], 'Money');
      if (mComp) moneyVal = mComp.amount;
    }

    // NEW: find utility from ECS (for the "Player" entity, presumably)
    let utilityVal = 0;
    const playerEnts = world.getEntitiesByComponent('Player');
    if (playerEnts.length > 0) {
      const playerId = playerEnts[0];
      const utilComp = world.getComponent(playerId, 'Utility');
      if (utilComp) {
        utilityVal = utilComp.value;
      }
    }

    // If we haven't set world.reputation, default to 0
    let repVal = world.reputation || 0;

    p5.text(`Utility: ${utilityVal}`, statsX, statsY + 14);
    p5.text(`Money:  $${moneyVal}`, statsX, statsY + 30);
    p5.text(`Reputation: ${repVal}`, statsX, statsY + 46);

    p5.pop();
  }
}
