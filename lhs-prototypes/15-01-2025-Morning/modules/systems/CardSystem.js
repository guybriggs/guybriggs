// modules/systems/CardSystem.js

import { cardData } from '../ui/CardData.js';

export class CardSystem {
  constructor() {
    // We’ll store the card array with dynamic x,y
    // Make them smaller by default
    this.cards = cardData.map(c => ({ 
      ...c, 
      // Instead of 50×70, let’s do 30×45 for smaller cards
      width:  c.customWidth  || 30, 
      height: c.customHeight || 45,
      x: 0, 
      y: 0 
    }));
    this.selectedCardType = null;
    this.hoveredCard = null;
    this.spacing = 5;  // reduce spacing for smaller cards
    this.bottomOffset = 60;
    this.wobbleFrame = 0;

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.selectedCardType = null;
      }
    });
  }

  getSelectedCard() {
    return this.selectedCardType;
  }

  update(p5) {
    const mx = p5.mouseX;
    const my = p5.mouseY;
    this.hoveredCard = null;

    for (let c of this.cards) {
      if (mx >= c.x && mx < c.x + c.width &&
          my >= c.y && my < c.y + c.height) {
        this.hoveredCard = c.id;
      }
    }
  }

  handleClick(mx, my) {
    for (let c of this.cards) {
      if (mx >= c.x && mx < c.x + c.width &&
          my >= c.y && my < c.y + c.height) {
        // If re-click => cancel
        if (this.selectedCardType === c.type) {
          this.selectedCardType = null;
        } else {
          this.selectedCardType = c.type;
          this.wobbleFrame = 10;
        }
        return true;
      }
    }
    return false;
  }

  draw(p5) {
    p5.push();
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(20); // can reduce the icon text size for smaller cards

    const totalW = this.cards.reduce((acc, c) => acc + c.width, 0)
                   + (this.cards.length - 1) * this.spacing;
    let startX = (p5.width - totalW) / 2;
    const cardY = p5.height - this.bottomOffset;

    if (this.wobbleFrame > 0) {
      this.wobbleFrame--;
    }

    for (let c of this.cards) {
      c.x = startX;
      c.y = cardY;
      startX += c.width + this.spacing;

      const isHovered = (this.hoveredCard === c.id);
      const isSelected = (this.selectedCardType === c.type);

      p5.push();
      if (isSelected) p5.fill(255, 200, 100);
      else if (isHovered) p5.fill(255, 230, 150);
      else p5.fill(255, 220);

      p5.noStroke();
      p5.translate(c.x + c.width/2, c.y + c.height/2);

      if ((isHovered || isSelected) && this.wobbleFrame > 0) {
        const rotAmt = 0.1 * Math.sin(this.wobbleFrame * 0.5);
        p5.rotate(rotAmt);
        p5.scale(1.05, 1.05);
      }

      p5.translate(-c.width/2, -c.height/2);
      p5.rect(0, 0, c.width, c.height, 5);

      p5.fill(30);
      p5.text(c.icon, c.width/2, c.height/2);
      p5.pop();
    }

    p5.pop();
  }
}
