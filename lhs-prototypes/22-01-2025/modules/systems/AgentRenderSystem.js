// modules/systems/AgentRenderSystem.js
import { EmotionTypes } from '../components/Emotion.js';
import { tileSize } from '../tile/TileMap.js';
import { drawFace } from '../utils/FaceRenderer.js';
import { Goods } from '../data/Goods.js';

export class AgentRenderSystem {
  update(world, p5) {
    const renderableEntities = world.getEntitiesByComponents(
      ['Renderable', 'Position', 'Name', 'Emotion']
    );

    for (let entity of renderableEntities) {
      const renderable = world.getComponent(entity, 'Renderable');
      const pos = world.getComponent(entity, 'Position');
      const vel = world.getComponent(entity, 'Velocity');
      const name = world.getComponent(entity, 'Name');
      const emotion = world.getComponent(entity, 'Emotion');
      const demand = world.getComponent(entity, 'Demand');
      const supply = world.getComponent(entity, 'Supply');
      const job = world.getComponent(entity, 'Job');
      const inventory = world.getComponent(entity, 'Inventory');
      const follower = world.getComponent(entity, 'Follower');

      if (!renderable || !pos || !name || !emotion) continue;

      // 1) Draw "clothes" behind body if name is not empty
      if (name.firstName !== '') {
        p5.fill(follower ? 'dodgerblue' : 'coral');
        p5.noStroke();
        p5.ellipse(pos.x, pos.y + 5, renderable.radius * 1.5, renderable.radius * 1.5);
      }

      // 2) Draw the main body circle
      p5.push();
      p5.noStroke();
      if (renderable.helmet && renderable.helmetColor === 'red') {
        // Red helmet => red body
        p5.fill('#E38A8A');
      } else if (renderable.helmet) {
        // Normal worker helmet => typical worker color
        p5.fill('#E3E763');
      } else if (supply) {
        // Any supply but no helmet => green
        p5.fill('green');
      } else if (demand) {
        // If has demand => orange
        p5.fill('orange');
      } else {
        // Default color
        p5.fill(renderable.color || 'white');
      }
      p5.ellipse(pos.x, pos.y, renderable.radius * 2, renderable.radius * 2);

      // 3) Draw built-in helmet if present
      if (renderable.helmet) {
        const helmetCol = renderable.helmetColor || 'yellow';
        p5.fill(helmetCol);
        p5.arc(
          pos.x,
          pos.y - renderable.radius,
          renderable.radius * 2,
          renderable.radius * 1.5,
          Math.PI,
          2 * Math.PI
        );
      }
      p5.pop();

      // 4) Assistant hat => small white arc
      if (supply && supply.good === Goods.ASSISTANT_WORK) {
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

      // 5) Fisherman rod => supply.good === 'fish_work'
      //    (We do NOT draw a rod for normal fish-sellers)
      if (supply && supply.good === Goods.FISH_WORK) {
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

      // 6) Blue cap for fish-sellers => supply.good === 'fish'
      //    We'll do something like the assistant’s hat, but in light blue.
      if (supply && supply.good === Goods.FISH) {
        p5.push();
        p5.fill('#82c8fa'); // a pleasant light-blue
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

      // ******* NEW: If fisherman has fish, show fish icon above their head *******
      if (supply && supply.good === Goods.FISH_WORK && inventory) {
        const fishCount = inventory.items.fish || 0;
        if (fishCount > 0) {
          // Draw a small fish icon above their head
          p5.push();
          p5.fill('#f2b300'); // Some fish color, or any color you prefer
          p5.noStroke();
          // For example, a simple fish shape or text "🐟"
          p5.textAlign(p5.CENTER, p5.CENTER);
          p5.textSize(14);
          // Position it about 15 px above the head
          p5.text('🐟', pos.x, pos.y - renderable.radius - 15);
          p5.pop();
        }
      }

      // 7) Face
      const faceColor = 'black';
      drawFace(p5, pos.x, pos.y, renderable.radius, emotion.type, faceColor);

      // 8) Agent name
      p5.strokeWeight(0);
      p5.push();
      p5.fill('#000000');
      p5.textAlign(p5.CENTER, p5.BOTTOM);
      p5.textSize(6);
      p5.text(name.firstName, pos.x, pos.y - renderable.radius - 10);
      p5.pop();

      // 9) Speech bubble
      const speechBubble = world.getComponent(entity, 'SpeechBubble');
      if (speechBubble && speechBubble.visible) {
        if (speechBubble.index < speechBubble.fullText.length) {
          speechBubble.typed += speechBubble.fullText.charAt(speechBubble.index);
          speechBubble.index++;
        }
        p5.push();
        p5.textSize(10);
        const padding = 5;
        const textWidth = p5.textWidth(speechBubble.typed) + padding;
        const bubbleHeight = 15;
        const bubbleY = pos.y - renderable.radius - bubbleHeight - 20;

        p5.fill(speechBubble.bubbleColor || 'white');
        p5.noStroke();
        p5.rect(pos.x - textWidth / 2, bubbleY, textWidth, bubbleHeight, 5);

        p5.fill('#232323');
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(8);
        p5.text(speechBubble.typed, pos.x, bubbleY + bubbleHeight / 2);
        p5.pop();
      }

      // 10) Supply/demand label text
      if (supply) {
        p5.push();
        p5.fill('#000000');
        p5.textAlign(p5.CENTER, p5.TOP);
        p5.textSize(6);
        p5.text(
          `$${supply.reservationPrice}!`,
          pos.x,
          pos.y + renderable.radius + 5
        );
        p5.pop();
      }
      if (demand) {
        p5.push();
        p5.fill('#000000');
        p5.textAlign(p5.CENTER, p5.TOP);
        p5.textSize(6);
        p5.text(
          `$${demand.reservationPrice}!`,
          pos.x,
          pos.y + renderable.radius + 5
        );
        p5.pop();
      }

      // 11) Hammer animation for constructing workers (unchanged)
      const constructionTask = world.getComponent(entity, 'ConstructionTask');
      if (constructionTask && constructionTask.constructing) {
        p5.push();
        p5.translate(pos.x + renderable.radius, pos.y - renderable.radius);
        p5.rotate(sin(millis() * 0.01) * 0.5);
        p5.fill(120);
        const hw = renderable.radius / 2;
        const hh = renderable.radius / 8;
        p5.rect(0, 0, hw, hh);
        p5.rect(hw, 0, hw / 2, hh * 3);
        p5.pop();
      }

      // 12) The old snippet for job+inventory => we can remove or keep
      //     If you'd like to remove the fishing rod lines here, you can.
      //     Because we've already handled fishermen above.
      if (job && inventory && supply) {
        if (supply.good) {
          // If the supply is 'fish' => do not draw rod again
          // If it’s 'fish_work' => we’ve already drawn the rod above
          if (supply.good !== 'fish') return;
        }
        // The rest of your old logic can stay or be commented out 
        // if you don't want a second rod drawn.
        // ...
      }
    }
  }
}
