// modules/systems/AgentRenderSystem.js

import { EmotionTypes } from '../components/Emotion.js';
import { tileSize } from '../tile/TileMap.js';
import { drawFace } from '../utils/FaceRenderer.js';
import { Goods } from '../data/Goods.js';

/**
 * The AgentRenderSystem draws any entity with:
 *  - 'Renderable'
 *  - 'Position'
 *  - 'Name'
 *  - 'Emotion'
 */
export class AgentRenderSystem {
  update(world, p5) {
    // 1) Gather all entities that have those four components
    const renderableEntities = world.getEntitiesByComponents(
      ['Renderable', 'Position', 'Name', 'Emotion']
    );

    for (let entity of renderableEntities) {
      // 2) Retrieve each relevant component
      const renderable = world.getComponent(entity, 'Renderable');
      const pos = world.getComponent(entity, 'Position');
      const name = world.getComponent(entity, 'Name');
      const emotion = world.getComponent(entity, 'Emotion');
      const vel = world.getComponent(entity, 'Velocity');

      // Possibly also get demand/supply
      const demand = world.getComponent(entity, 'Demand');
      const supply = world.getComponent(entity, 'Supply');
      const job = world.getComponent(entity, 'Job');
      const inventory = world.getComponent(entity, 'Inventory');
      // Follower
      const follower = world.getComponent(entity, 'Follower');

      // 3) If missing a crucial component => skip
      if (!renderable || !pos || !name || !emotion) continue;

      // 4) Draw the main body
      p5.push();
      p5.noStroke();

      // ─────────────────────────────────────────────
      // If it's a follower => check isDetached
      // ─────────────────────────────────────────────
      if (follower) {
        if (follower.isDetached) {
          // If they've gotten a job => bright pink
          p5.fill('hotpink');
        } else {
          // If still following => normal color
          p5.fill(renderable.color || 'white');
        }
      }
      // Otherwise => do normal logic for supply/demand/helmet
      else if (renderable.helmet && renderable.helmetColor === 'red') {
        // Red helmet => body color #E38A8A
        p5.fill('#E38A8A');
      } else if (renderable.helmet) {
        // Normal worker helmet => typical worker color
        p5.fill('#E3E763');
      } else if (supply) {
        // Entities with 'Supply' => green
        p5.fill('green');
      } else if (demand) {
        // Entities with 'Demand' => orange
        p5.fill('orange');
      } else {
        // Default color
        p5.fill(renderable.color || 'white');
      }

      // Now draw the circle
      p5.ellipse(pos.x, pos.y, renderable.radius * 2, renderable.radius * 2);
      p5.pop();

      // 2) If it has a Demand component => draw a small gold coin at bottom-right
  if (demand) {
    const coinOffsetX = renderable.radius; // shift to the right of the circle
    const coinOffsetY = renderable.radius;     // shift slightly down
    const coinRadius = 12;

    // Draw the gold coindw
    p5.push();
    p5.fill('#FCF92F'); // gold color
    p5.noStroke();
    p5.circle(pos.x + coinOffsetX, pos.y + coinOffsetY, coinRadius);

    // Draw a small dollar sign in black, centered inside the coin
    p5.fill(0);
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(8);
    p5.text('$', pos.x + coinOffsetX, pos.y + coinOffsetY + 0.5);
    p5.pop();
  }

      // 5) If they have a helmet => optionally draw a small arc on top
      if (renderable.helmet) {
        p5.push();
        p5.fill(renderable.helmetColor || 'yellow');
        p5.noStroke();
        // For example, draw an arc above their head
        p5.arc(
          pos.x,
          pos.y - renderable.radius,
          renderable.radius * 1.4,
          renderable.radius,
          Math.PI,
          2 * Math.PI
        );
        p5.pop();
      }

      // 6) If supply/demand => special hats
      if (supply && supply.good === Goods.ASSISTANT_WORK) {
        // Assistant => small white arc
        p5.push();
        p5.fill('white');
        p5.noStroke();
        const hatWidth = renderable.radius;
        const hatHeight = renderable.radius * 0.8;
        p5.arc(
          pos.x,
          pos.y - renderable.radius * 0.9,
          hatWidth,
          hatHeight,
          Math.PI,
          2 * Math.PI
        );
        p5.pop();
      }
      if (supply && supply.good === Goods.FISH_WORK) {
        // fisherman => draw rod
        p5.push();
        p5.stroke('#4e2b15'); // dark brown
        p5.strokeWeight(3);
        const rodStartX = pos.x + renderable.radius;
        const rodStartY = pos.y;
        const rodEndX = rodStartX + 10;
        const rodEndY = rodStartY - 10;
        p5.line(rodStartX, rodStartY, rodEndX, rodEndY);
        p5.pop();
      }
      if (supply && supply.good === Goods.FISH) {
        // fish-seller => small light-blue arc
        p5.push();
        p5.fill('#82c8fa');
        p5.noStroke();
        const capWidth = renderable.radius;
        const capHeight = renderable.radius * 0.8;
        p5.arc(
          pos.x,
          pos.y - renderable.radius * 0.9,
          capWidth,
          capHeight,
          Math.PI,
          2 * Math.PI
        );
        p5.pop();
      }

      // 7) Possibly show fish icon if fisher carrying fish
      if (supply && supply.good === Goods.FISH_WORK && inventory) {
        const fishCount = inventory.items.fish || 0;
        if (fishCount > 0) {
          p5.push();
          p5.textAlign(p5.CENTER, p5.CENTER);
          p5.textSize(14);
          p5.fill('#f2b300');
          p5.noStroke();
          p5.text('🐟', pos.x, pos.y - renderable.radius - 15);
          p5.pop();
        }
      }

      // 8) Draw the face
      drawFace(p5, pos.x, pos.y, renderable.radius, emotion.type, 'black');

      // 9) Draw name
      p5.strokeWeight(0);
      p5.push();
      p5.fill('#000000');
      p5.textAlign(p5.CENTER, p5.BOTTOM);
      p5.textSize(6);
      p5.text(name.firstName, pos.x, pos.y - renderable.radius - 10);
      p5.pop();

      // 10) If entity has a speech bubble => draw it
      const speechBubble = world.getComponent(entity, 'SpeechBubble');
      if (speechBubble && speechBubble.visible) {
        // Example simple approach
        p5.push();
        p5.textSize(10);
        p5.fill(speechBubble.bubbleColor || 'white');
        p5.noStroke();

        const typed = speechBubble.typed; // text so far
        const textW = p5.textWidth(typed) + 6;
        const bubbleH = 15;
        const bubbleX = pos.x - textW / 2;
        const bubbleY = pos.y - renderable.radius - bubbleH - 20;

        p5.rect(bubbleX, bubbleY, textW, bubbleH, 4);

        p5.fill('#232323');
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(8);
        p5.text(typed, bubbleX + textW / 2, bubbleY + bubbleH / 2);
        p5.pop();
      }

      // 11) If supply => draw price text
      if (supply) {
        p5.push();
        p5.fill('#000000');
        p5.textAlign(p5.CENTER, p5.TOP);
        p5.textSize(6);
        p5.text(
          `$${supply.reservationPrice || 0}`,
          pos.x,
          pos.y + renderable.radius + 5
        );
        p5.pop();
      }

      // 12) If demand => likewise
      if (demand) {
        p5.push();
        p5.fill('#000000');
        p5.textAlign(p5.CENTER, p5.TOP);
        p5.textSize(6);
        p5.text(
          `$${demand.reservationPrice || 0}`,
          pos.x,
          pos.y + renderable.radius + 5
        );
        p5.pop();
      }

      // 13) If constructing => hammer anim
      const constructionTask = world.getComponent(entity, 'ConstructionTask');
      if (constructionTask && constructionTask.constructing) {
        // e.g. draw a rotating hammer
        p5.push();
        p5.translate(pos.x + renderable.radius, pos.y - renderable.radius);
        // use p5.sin(...) or p5.millis() 
        p5.rotate(Math.sin(p5.millis() * 0.01) * 0.5);
        p5.fill(120);
        const hw = renderable.radius / 2;
        const hh = renderable.radius / 8;
        p5.rect(0, 0, hw, hh);
        p5.rect(hw, 0, hw / 2, hh * 3);
        p5.pop();
      }

      // 14) If job + inventory => optional
      // ...
    }
  }
}
