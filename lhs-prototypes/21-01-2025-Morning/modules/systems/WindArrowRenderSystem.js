// modules/systems/WindArrowRenderSystem.js

export class WindArrowRenderSystem {
    constructor(windArrowSystem) {
      this.windArrowSystem = windArrowSystem;
      this.arrowSize = 10; // half-length
    }
  
    update(world, p5) {
      p5.push();
      p5.noStroke();
      for (let arrow of this.windArrowSystem.arrows) {
        p5.push();
        p5.translate(arrow.x, arrow.y);
        p5.rotate(arrow.rotation);
        p5.fill(255, arrow.alpha);
        p5.triangle(
          -this.arrowSize, -this.arrowSize / 2,
          -this.arrowSize,  this.arrowSize / 2,
           this.arrowSize,  0
        );
        p5.pop();
      }
      p5.pop();
    }
  }
  