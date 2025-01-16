// modules/systems/AgentRenderSystem.js
import { EmotionTypes } from '../components/Emotion.js';
import { tileSize } from '../tile/TileMap.js';
import { drawFace } from '../utils/FaceRenderer.js';

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

      // Draw clothes
      p5.fill(follower ? "dodgerblue" : "coral");
      p5.noStroke();
      p5.ellipse(pos.x, pos.y + 5, renderable.radius * 1.5, renderable.radius * 1.5);

      // Draw body
      p5.push();
      p5.noStroke();
      if (renderable.helmet && renderable.helmetColor === 'red') {
        p5.fill('#E38A8A'); // Body circle is red for red helmet
      } else if (renderable.helmet) {
        p5.fill('#E3E763'); // Worker body color
      } else if (supply) {
        p5.fill('green');
      } else if (demand) {
        p5.fill('orange');
      } else {
        p5.fill(renderable.color || 'white');
      }
      p5.ellipse(pos.x, pos.y, renderable.radius * 2, renderable.radius * 2);

      // Draw helmet if applicable
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

      // Face
      const faceColor = (renderable.helmet && renderable.helmetColor === 'red') ? 'black' : 'black';
      drawFace(p5, pos.x, pos.y, renderable.radius, emotion.type, faceColor);

      // Agent name
      p5.strokeWeight(0);
      p5.push();
      p5.fill(255);
      p5.textAlign(p5.CENTER, p5.BOTTOM);
      p5.text(name.firstName, pos.x, pos.y - renderable.radius - 10);
      p5.pop();

      // Render speech bubble if present
      const speechBubble = world.getComponent(entity, 'SpeechBubble');
      if (speechBubble && speechBubble.visible) {
        // Typewriter effect: reveal one character per frame
        if (speechBubble.index < speechBubble.fullText.length) {
          speechBubble.typed += speechBubble.fullText.charAt(speechBubble.index);
          speechBubble.index++;
        }
        p5.push();
        p5.textSize(12);
        const padding = 10;
        const textWidth = p5.textWidth(speechBubble.typed) + padding;
        const bubbleHeight = 26;
        // Position the bubble above the agent with extra space
        const bubbleY = pos.y - renderable.radius - bubbleHeight - 30;
        
        // Draw the speech bubble rectangle centered above the agent
        p5.fill(speechBubble.bubbleColor || 'white');
        p5.noStroke();
        p5.rect(pos.x - textWidth / 2, bubbleY, textWidth, bubbleHeight, 5);
        
        // Draw grey text centered in the bubble
        p5.fill('#232323');
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text(speechBubble.typed, pos.x, bubbleY + bubbleHeight / 2);
        p5.pop();
      }

      // Supply/demand labels
        p5.fill(255);
      if (supply) {
        p5.push();
        p5.textAlign(p5.CENTER, p5.TOP);
        p5.text(`Selling a ${supply.good}\nPay me $${supply.reservationPrice}!`, pos.x, pos.y + renderable.radius + 5);
        p5.pop();
      }
      if (demand) {
        p5.push();
        p5.textAlign(p5.CENTER, p5.TOP);
        p5.text(`Buying a ${demand.good}\nI'll pay $${demand.reservationPrice}!`, pos.x, pos.y + renderable.radius + 5);
        p5.pop();
      }

      // Hammer animation for constructing workers
      const constructionTask = world.getComponent(entity, 'ConstructionTask');
      if (constructionTask && constructionTask.constructing) {
        p5.push();
        p5.translate(pos.x + renderable.radius, pos.y - renderable.radius);
        p5.rotate(sin(millis() * 0.01) * 0.5);
        p5.fill(120);
        let hw = renderable.radius / 2;
        let hh = renderable.radius / 8;
        p5.rect(0, 0, hw, hh);
        p5.rect(hw, 0, hw / 2, hh * 3);
        p5.pop();
      }

      // Within the loop for each agent...
      if (job && inventory && supply) {
        if (supply.good) {
          if (supply.good !== 'fish') return;
        }
        const bPos = world.getComponent(entity, 'Position');
        let rodX = bPos.x, rodY = bPos.y, rodLen = 20;
        p5.strokeWeight(1);
        p5.stroke(139, 69, 19);
        p5.line(rodX, rodY, rodX + rodLen / 2, rodY - rodLen);
        p5.stroke(192, 192, 192);
        p5.line(rodX + rodLen / 2, rodY, rodX + rodLen / 2, rodY - rodLen);
        p5.strokeWeight(0);
      }
    }
  }
}
