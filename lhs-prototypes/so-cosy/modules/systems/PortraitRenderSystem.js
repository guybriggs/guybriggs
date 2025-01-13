// modules/systems/PortraitRenderSystem.js

export class PortraitRenderSystem {
  constructor(width = 80, height = 80) {
    // Size of the portrait area
    this.width = width;
    this.height = height;
    // Position on screen
    this.x = 10;  // left
    this.y = 10;  // top
  }

  update(p5) {
    // Draw a background for the portrait
    p5.push();
    p5.noStroke();
    p5.fill(0, 150); // semi-transparent black
    p5.rect(this.x, this.y, this.width, this.height);

    // Draw the face
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    // Face circle
    p5.fill('#f2d9b2');
    p5.stroke(0);
    p5.circle(cx, cy, 50);

    // Eyes
    p5.fill(0);
    p5.noStroke();
    p5.circle(cx - 8, cy - 5, 6);
    p5.circle(cx + 8, cy - 5, 6);

    // Smile
    p5.noFill();
    p5.stroke(0);
    p5.arc(cx, cy + 5, 16, 12, 0, Math.PI);

    p5.pop();
  }
}
