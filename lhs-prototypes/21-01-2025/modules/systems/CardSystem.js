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

    // =========================
    // 2) Fishing Rod deck
    // =========================
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

    // =========================
    // 3) Floor-specific decks
    // =========================

    // -- Kitchen Floor --
    this.kitchenDeck = [
      { id: 'stove',     label: 'Stove',     type: 'stove',     icon: '🍳', width: 30, height: 45 },
      { id: 'fridge',    label: 'Fridge',    type: 'fridge',    icon: '🧊', width: 30, height: 45 },
      { id: 'plant',     label: 'Plant',     type: 'pottedplant', icon: '🌱', width: 30, height: 45 },
      { id: 'fryer',     label: 'Fryer',     type: 'fryer',     icon: '🍟', width: 30, height: 45 },
      { id: 'table',     label: 'Table',     type: 'table',     icon: '🍽️', width: 30, height: 45 },
      { id: 'stools',    label: 'Stools',    type: 'stools',    icon: '🪑', width: 30, height: 45 },
      { id: 'counter',   label: 'Kitchen Counter', type: 'counter', icon: '🔪', width: 30, height: 45 },
    ];

    // -- Living Room Floor --
    this.livingRoomDeck = [
      { id: 'heater',  label: 'Heater',  type: 'heater',  icon: '🔥', width: 30, height: 45 },
      { id: 'plant',   label: 'Plant',   type: 'pottedplant', icon: '🌱', width: 30, height: 45 },
      { id: 'tv',      label: 'TV',      type: 'tv',      icon: '📺', width: 30, height: 45 },
      { id: 'smallsofa', label: 'Sofa', type: 'smallsofa', icon: '🛋️', width: 30, height: 45 },
    ];

    // -- Bedroom Floor --
    this.bedroomDeck = [
      { id: 'bed',   label: 'Bed',   type: 'bed',   icon: '🛏️', width: 30, height: 45 },
      { id: 'plant', label: 'Plant', type: 'pottedplant', icon: '🌱', width: 30, height: 45 },
    ];

    // ========== Fish Production Deck ==========
    this.fishProdDeck = [
      { id: 'icebox', label: 'Icebox', type: 'icebox', icon: '🧊', width: 30, height: 45 },
      { id: 'plant',  label: 'Plant',  type: 'pottedplant', icon: '🌱', width: 30, height: 45 },
      { id: 'fishrod', label: 'Fishing Rod', type: 'fishingrod', icon: '🎣', width: 30, height: 45 },
    ];

    // -- Reception Floor --
    this.receptionDeck = [
      { id: 'fish_register',        label: 'Fish Cash Register',         type: 'cashregister', icon: '🐟', width: 30, height: 45 },
      { id: 'fish_chips_register',  label: 'Fish & Chips Cash Register', type: 'fishchips_cash', icon: '🍟', width: 30, height: 45 },
      { id: 'fish_stew_register',   label: 'Fish Stew Cash Register',    type: 'fishstew_cash', icon: '🍲', width: 30, height: 45 },
      { id: 'bread_register',       label: 'Bread Cash Register',        type: 'bread_cash', icon: '🍞', width: 30, height: 45 },
      { id: 'stools',               label: 'Stools',                     type: 'stools',     icon: '🪑', width: 30, height: 45 },
      { id: 'plant',                label: 'Plant',                      type: 'pottedplant', icon: '🌱', width: 30, height: 45 },
      { id: 'smallsofa',            label: 'Sofa',                       type: 'smallsofa',   icon: '🛋️', width: 30, height: 45 },
    ];

    // ========== Staffroom Floor Deck ==========
    this.staffroomDeck = [
      { id: 'coffeeMachine', label: 'Coffee Machine', type: 'coffeemachine', icon: '☕', width: 30, height: 45 },
      { id: 'waterDispenser', label: 'Water Dispenser', type: 'waterdispenser', icon: '💧', width: 30, height: 45 },
      { id: 'stools', label: 'Stools', type: 'stools', icon: '🪑', width: 30, height: 45 },
      { id: 'table', label: 'Table', type: 'table', icon: '🍽️', width: 30, height: 45 },
      { id: 'tv', label: 'TV', type: 'tv', icon: '📺', width: 30, height: 45 },
      { id: 'plant', label: 'Plant', type: 'pottedplant', icon: '🌱', width: 30, height: 45 },
    ];

    // ========== Bathroom Floor Deck ==========
    this.bathroomDeck = [
      { id: 'toilet', label: 'Toilet', type: 'toilet', icon: '🚽', width: 30, height: 45 },
      { id: 'sink', label: 'Sink', type: 'sink', icon: '🚰', width: 30, height: 45 },
      { id: 'plant', label: 'Plant', type: 'pottedplant', icon: '🌱', width: 30, height: 45 },
    ];

    // Start with default deck
    this.cards = [...this.defaultCards];

    // Track which deck is currently active
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

  // =============== HELPER METHODS FOR SWAPPING ===============
  swapToDefaultDeck() {
    if (this.currentDeck === 'default') return;
    this.currentDeck = 'default';
    this.cards = this.defaultCards.map(c => ({ ...c }));
    this.selectedCardType = null;
  }

  swapToFishingRodDeck() {
    if (this.currentDeck === 'fishingrod') return;
    this.currentDeck = 'fishingrod';
    this.cards = this.fishingRodCards.map(c => ({ ...c }));
    this.selectedCardType = null;
  }

  swapToKitchenDeck() {
    if (this.currentDeck === 'kitchen') return;
    this.currentDeck = 'kitchen';
    this.cards = this.kitchenDeck.map(c => ({ ...c }));
    this.selectedCardType = null;
  }

  swapToLivingRoomDeck() {
    if (this.currentDeck === 'livingroom') return;
    this.currentDeck = 'livingroom';
    this.cards = this.livingRoomDeck.map(c => ({ ...c }));
    this.selectedCardType = null;
  }

  swapToBedroomDeck() {
    if (this.currentDeck === 'bedroom') return;
    this.currentDeck = 'bedroom';
    this.cards = this.bedroomDeck.map(c => ({ ...c }));
    this.selectedCardType = null;
  }

  swapToFishProdDeck() {
    if (this.currentDeck === 'fishprod') return;
    this.currentDeck = 'fishprod';
    this.cards = this.fishProdDeck.map(c => ({ ...c }));
    this.selectedCardType = null;
  }

  swapToReceptionDeck() {
    if (this.currentDeck === 'reception') return;
    this.currentDeck = 'reception';
    this.cards = this.receptionDeck.map(c => ({ ...c }));
    this.selectedCardType = null;
  }

  swapToStaffroomDeck() {
    if (this.currentDeck === 'staffroom') return;
    this.currentDeck = 'staffroom';
    this.cards = this.staffroomDeck.map(c => ({ ...c }));
    this.selectedCardType = null;
  }

  swapToBathroomDeck() {
    if (this.currentDeck === 'bathroom') return;
    this.currentDeck = 'bathroom';
    this.cards = this.bathroomDeck.map(c => ({ ...c }));
    this.selectedCardType = null;
  }

  // =============== REMAINDER OF CARD SYSTEM ===============
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
        // If re-click => cancel selection
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

    // Base color depends on deck
    const baseColor = (this.currentDeck === 'fishingrod')
      ? p5.color(154, 184, 229) // subtle blue
      : p5.color(255, 220);     // normal off-white

    for (let c of toRender) {
      c.x = startX;
      c.y = cardY;
      startX += c.width + this.spacing;

      const isHovered = (this.hoveredCard === c.id);
      const isSelected = (this.selectedCardType === c.type);

      p5.push();
      p5.translate(c.x + c.width / 2, c.y + c.height / 2);

      // Wobble if hovered/selected
      if ((isHovered || isSelected) && this.wobbleFrame > 0) {
        const rotAmt = 0.1 * Math.sin(this.wobbleFrame * 0.5);
        p5.rotate(rotAmt);
        p5.scale(1.05, 1.05);
      }

      // Move origin so 0,0 is top-left corner
      p5.translate(-c.width / 2, -c.height / 2);

      // Draw base card
      p5.noStroke();
      p5.fill(baseColor);
      p5.rect(0, 0, c.width, c.height, 5);

      // If hovered => highlight
      if (isHovered) {
        p5.fill(255, 230, 150, 150);
        p5.rect(0, 0, c.width, c.height, 5);
      }

      // If selected => selection highlight
      if (isSelected) {
        p5.fill(255, 200, 100, 200);
        p5.rect(0, 0, c.width, c.height, 5);
      }

      // Draw main icon in center
      p5.fill(30);
      p5.textSize(16);
      p5.text(c.icon, c.width / 2, c.height / 2);

      // If hovered => show label + cost
      if (isHovered) {
        p5.fill(0);
        p5.textSize(12);
        p5.text(c.label, c.width / 2, -25);
        p5.text('$10', c.width / 2, -10);
      }

      // Extra corner icons for floors
      // We'll do a switch statement for each floor
      // to place a small icon in the bottom-right corner
      if (c.type === 'bedroom_floor') {
        // e.g. bed icon or "🛏️"
        this.drawCornerIcon(p5, '🛏️', c.width, c.height);
      } else if (c.type === 'kitchen_floor') {
        this.drawCornerIcon(p5, '🍳', c.width, c.height);
      } else if (c.type === 'livingroom_floor') {
        this.drawCornerIcon(p5, '🛋️', c.width, c.height);
      } else if (c.type === 'bathroom_floor') {
        this.drawCornerIcon(p5, '🚽', c.width, c.height);
      } else if (c.type === 'fishproduction_floor') {
        this.drawCornerIcon(p5, '🐟', c.width, c.height);
      } else if (c.type === 'reception_floor') {
        this.drawCornerIcon(p5, '🏷️', c.width, c.height);
      } else if (c.type === 'staffroom_floor') {
        this.drawCornerIcon(p5, '☕', c.width, c.height);
      }

      p5.pop();
    }
    p5.pop();
  }

  /**
   * drawCornerIcon(p5, icon, cardWidth, cardHeight)
   *  - Utility to draw a small icon at the bottom-right corner.
   */
  drawCornerIcon(p5, icon, cardW, cardH) {
    p5.push();
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(14);
    p5.fill(0);
    // position near bottom-right => e.g. offset ~ 5 or 10 px
    p5.text(icon, cardW - 12, cardH - 15);
    p5.pop();
  }
}
