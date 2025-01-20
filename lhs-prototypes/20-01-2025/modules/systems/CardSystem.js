// modules/systems/CardSystem.js

import { cardData } from '../ui/CardData.js';
import { spriteMappings } from '../utils/SpriteMapping.js';

export class CardSystem {
  constructor() {
    // Default deck uses 30×45 for all cards unless overridden
    this.defaultCards = cardData.map(c => ({
      ...c,
      width: c.customWidth || 30,
      height: c.customHeight || 45,
      x: 0,
      y: 0,
    }));

    // Fishing Rod Decor Deck, forced 30×45 for uniformity
    this.fishingRodCards = [
      { id: 'bed',           label: 'Bed',           type: 'bed',           icon: '🛌',  width: 30, height: 45 },
      { id: 'smallsofa',     label: 'Sofa',          type: 'smallsofa',     icon: '🛋️', width: 30, height: 45 },
      { id: 'tv',            label: 'TV',            type: 'tv',            icon: '📺',  width: 30, height: 45 },
      { id: 'lamp',          label: 'Lamp',          type: 'lamp',          icon: '💡',  width: 30, height: 45 },
      { id: 'pottedplant',   label: 'Plant',         type: 'pottedplant',   icon: '🌱',  width: 30, height: 45 },
      { id: 'sculpture',     label: 'Sculpture',     type: 'sculpture',     icon: '🗿',  width: 30, height: 45 },
      { id: 'bigsign',       label: 'Big Sign',      type: 'bigsign',       icon: '📜',  width: 30, height: 45 },
      { id: 'fryer',         label: 'Fryer',         type: 'fryer',         icon: '🍳',  width: 30, height: 45 },
      { id: 'crate',         label: 'Crate',         type: 'crate',         icon: '📦',  width: 30, height: 45 },
      { id: 'coffeemachine', label: 'Coffee Machine',type: 'coffeemachine', icon: '☕',  width: 30, height: 45 },
      { id: 'bin',           label: 'Bin',           type: 'bin',           icon: '🗑️',  width: 30, height: 45 },
    ];

    // Start with default deck
    this.cards = [...this.defaultCards];

    this.selectedCardType = null;
    this.hoveredCard = null;
    this.spacing = 5;
    this.bottomOffset = 60;
    this.wobbleFrame = 0;
    this.currentDeck = 'default';

    // Listen for ESC to clear selection
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.selectedCardType = null;
      }
    });
  }

  /** Swap to the “fishing rod” deck if not already active. */
  swapToFishingRodDeck() {
    if (this.currentDeck === 'fishingrod') return;
    this.currentDeck = 'fishingrod';
    this.cards = this.fishingRodCards.map(c => ({ ...c }));
    this.selectedCardType = null;
  }

  /** Swap back to the default deck if not already active. */
  swapToDefaultDeck() {
    if (this.currentDeck === 'default') return;
    this.currentDeck = 'default';
    this.cards = this.defaultCards.map(c => ({ ...c }));
    this.selectedCardType = null;
  }

  getSelectedCard() {
    return this.selectedCardType;
  }

  update(p5) {
    const mx = p5.mouseX;
    const my = p5.mouseY;
    this.hoveredCard = null;

    // Determine which card (if any) is hovered
    for (let c of this.cards) {
      if (
        mx >= c.x && mx < c.x + c.width &&
        my >= c.y && my < c.y + c.height
      ) {
        this.hoveredCard = c.id;
      }
    }
  }

  handleClick(mx, my) {
    for (let c of this.cards) {
      if (
        mx >= c.x &&
        mx < c.x + c.width &&
        my >= c.y &&
        my < c.y + c.height
      ) {
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

  draw(p5, world) {
    p5.push();
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(20);

    const toRender = this.cards;
    const totalW =
      toRender.reduce((acc, c) => acc + c.width, 0) +
      (toRender.length - 1) * this.spacing;

    let startX = (p5.width - totalW) / 2;
    const cardY = p5.height - this.bottomOffset;

    if (this.wobbleFrame > 0) {
      this.wobbleFrame--;
    }

    // Define the base color for the deck:
    // If fishingrod => subtle blue for the base, else the usual off-white
    // Then we still add "hover" and "selected" overlays on top.
    const baseColor = this.currentDeck === 'fishingrod'
      ? p5.color(154, 184, 229) // subtle blue
      : p5.color(255, 220);

    for (let c of toRender) {
      c.x = startX;
      c.y = cardY;
      startX += c.width + this.spacing;

      const isHovered = (this.hoveredCard === c.id);
      const isSelected = (this.selectedCardType === c.type);

      p5.push();
      p5.translate(c.x + c.width / 2, c.y + c.height / 2);

      // Apply wobble if hovered or selected
      if ((isHovered || isSelected) && this.wobbleFrame > 0) {
        const rotAmt = 0.1 * Math.sin(this.wobbleFrame * 0.5);
        p5.rotate(rotAmt);
        p5.scale(1.05, 1.05);
      }

      // Move origin so 0,0 is top-left of the card
      p5.translate(-c.width / 2, -c.height / 2);

      // 1) Draw base fill (subtle blue if fishing rod deck, or normal off-white)
      p5.noStroke();
      p5.fill(baseColor);
      p5.rect(0, 0, c.width, c.height, 5);

      // 2) If hovered => overlay the hover color
      if (isHovered) {
        p5.fill(255, 230, 150, 150); // a semi-transparent overlay
        p5.rect(0, 0, c.width, c.height, 5);
      }
      // 3) If selected => overlay the selected color
      if (isSelected) {
        p5.fill(255, 200, 100, 200); // a bit stronger overlay
        p5.rect(0, 0, c.width, c.height, 5);
      }

      // Always show the icon in the center
      p5.fill(30);
      p5.textSize(16);
      p5.text(c.icon, c.width / 2, c.height / 2);

      // Show price & label ONLY if hovered
      if (isHovered) {
        p5.fill(0);
        p5.textSize(12);
        p5.text(c.label, c.width / 2, -25);
        p5.text('$10', c.width / 2, -10);
      }

      p5.pop();
    }
    p5.pop();
  }
}
