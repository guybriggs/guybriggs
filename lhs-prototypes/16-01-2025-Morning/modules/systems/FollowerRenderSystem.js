// modules/systems/FollowerRenderSystem.js

import { drawFace } from '../utils/FaceRenderer.js';

export class FollowerRenderSystem {
  update(world, p5) {
    // Retrieve all entities with the 'Follower' and necessary components
    const followerEntities = world.getEntitiesByComponents(['Follower', 'Position', 'Emotion']);
    
    for (let entity of followerEntities) {
      const followerComp = world.getComponent(entity, 'Follower');
      const pos = world.getComponent(entity, 'Position');
      const emotion = world.getComponent(entity, 'Emotion');
      
      if (!followerComp || !pos || !emotion) continue;

      // Draw the follower's body
      p5.push();
      p5.noStroke();
      p5.fill(followerComp.color || 'green');
      p5.ellipse(pos.x, pos.y, followerComp.size * 2, followerComp.size * 2);
      p5.pop();

      // Draw the follower's face based on emotion
      drawFace(p5, pos.x, pos.y, followerComp.size, emotion.type, 'black');

      // Draw the speech bubble if visible
      if (followerComp.speechBubble.visible) {
        p5.strokeWeight(0);
        const bubble = followerComp.speechBubble;
        let bw = Math.max(40, bubble.typedWidth);
        let bh = 16;
        const bx = pos.x + bubble.xOffset - bw / 2;
        const by = pos.y + bubble.yOffset - bh;

        p5.push();
        p5.fill(bubble.bubbleColor);
        p5.rect(bx, by, bw, bh);

        p5.fill(bubble.textColor);
        p5.textSize(10);
        // p5.textFont(...) if needed
        p5.textAlign(p5.LEFT, p5.BOTTOM); // Fix
        p5.text(bubble.typed, bx + 5, by + bh - 4);
        p5.pop();
      }
    }
  }
}
