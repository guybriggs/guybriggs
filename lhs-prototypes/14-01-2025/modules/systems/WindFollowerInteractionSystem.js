// modules/systems/WindFollowerInteractionSystem.js
import { randomRange } from '../utils/randomRange.js';
import { EmotionTypes } from '../components/Emotion.js';
import { typewriteLine } from '../logic/BubbleLogic.js';
import { isInForest } from '../utils/EnvironmentUtils.js';

export class WindFollowerInteractionSystem {
  constructor() {
    this.followerHitCounts = new Map();
    this.activeDialogues = new Map();
  }

  update(world, windSystem) {
    const followerEntities = world.getEntitiesByComponent('Follower');
    if (followerEntities.length === 0) return;
    const follower = followerEntities[0];
    const pos = world.getComponent(follower, 'Position');
    const comp = world.getComponent(follower, 'Follower');
    if (!pos || !comp) return;
    if (!isInForest(pos)) return;

    const hitArrows = windSystem.arrows.filter(a => {
      const dx = a.x - pos.x;
      const dy = a.y - pos.y;
      return Math.sqrt(dx*dx+dy*dy) < comp.size*2;
    });

    if (hitArrows.length) {
      if (!this.activeDialogues.has(follower)) {
        const msg = randomRange(0,1) === 0 ? "AH! That's COLD!" : "*ACHOOO*";
        typewriteLine(comp, msg, randomRange);
        this.activeDialogues.set(follower, Date.now());
      } else {
        const start = this.activeDialogues.get(follower);
        if (Date.now() - start > 5000) {
          this.activeDialogues.delete(follower);
        }
      }

      const count = (this.followerHitCounts.get(follower) || 0) + 1;
      this.followerHitCounts.set(follower, count);
      const emotionComp = world.getComponent(follower, 'Emotion');
      if (emotionComp) {
        if (count >= 3) {
          emotionComp.type = EmotionTypes.SICK;
          comp.color = getGreenColor(count);
        } else if (count === 1) {
          emotionComp.type = EmotionTypes.WORRIED;
        }
      }
    }
  }
}

function getGreenColor(count) {
  const colors = [
    "#CAE3C3",
    "#ACDE9D",
    "#92D17E",
    "#77CA5B",
    "#56D527"
  ];
  // Use the sequence starting at count 3
  // For count < 3, the function isn't called in current logic.
  // Clamp index to available colors.
  const index = Math.min(count - 3, colors.length - 1);
  return colors[index];
}
