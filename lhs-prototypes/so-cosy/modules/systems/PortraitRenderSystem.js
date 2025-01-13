// modules/systems/PortraitRenderSystem.js

export class PortraitRenderSystem {
  constructor() {
    // Define a smaller portrait icon, plus stats in a compact layout
    this.iconWidth = 40;
    this.iconHeight = 40;
    this.x = 10;  // top-left corner
    this.y = 10;

    // Stats
    this.utilityValue = 0;
    this.moneyValue = 0;
  }

  setUtility(val) {
    this.utilityValue = val;
  }

  setMoney(val) {
    this.moneyValue = val;
  }

  update(p5) {
    p5.push();

    // 1) Use an emoji as the simple portrait icon
    let iconCenterX = this.x + this.iconWidth / 2;
    let iconCenterY = this.y + this.iconHeight / 2;

    p5.noStroke();
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(24);  // Adjust size for the emoji
    p5.text('👨‍🦱', iconCenterX, iconCenterY);

    p5.pop();

    // 2) Utility & money text, using Gill Sans Condensed Bold (or fallback)
    p5.push();
    let statsX = this.x + this.iconWidth + 5;
    let statsY = this.y;
    p5.fill(255);

    p5.textSize(14);
    p5.textFont('Gill Sans');  // use a similar font if exact bold variant isn't available

    p5.text(`Utility: ${this.utilityValue}`, statsX, statsY + 14);
    p5.text(`Money:  $${this.moneyValue}`, statsX, statsY + 30);

    p5.pop();
  }
}
