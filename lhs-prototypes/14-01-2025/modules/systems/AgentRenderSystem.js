// modules/systems/AgentRenderSystem.js

import { EmotionTypes } from '../components/Emotion.js';
import { drawFace } from '../utils/FaceRenderer.js';

export class AgentRenderSystem {
  update(world, p5) {
    // Retrieve all entities with the necessary components
    const renderableEntities = world.getEntitiesByComponents(['Renderable', 'Position', 'Name', 'Emotion']);

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

      if (!renderable || !pos || !name || !emotion) continue;

      // Draw the agent's body
      p5.push();
      p5.noStroke();
      if (renderable.helmet) {
        p5.fill('#E3E763');  // Worker color
      } else if (supply) {
        p5.fill('green');
      } else if(demand) {
        p5.fill('orange');
      } else {
        p5.fill(renderable.color || 'white');
      }
      p5.ellipse(pos.x, pos.y, renderable.radius * 2, renderable.radius * 2);

      // Draw helmet if applicable
      if(renderable.helmet) {
        p5.fill('yellow');
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

      // Draw the agent's face based on emotion
      drawFace(p5, pos.x, pos.y, renderable.radius, emotion.type, 'black');

      p5.strokeWeight(0); // No stroke on the text

      // Draw the agent's name above their head
      p5.push();
      p5.fill(0);
      p5.textAlign(p5.CENTER, p5.BOTTOM);
      p5.text(name.name, pos.x, pos.y - renderable.radius - 10);
      p5.pop();

      // Optional supply/demand display
      if (supply) {
        p5.push();
        p5.fill(0, 128, 0);
        p5.textAlign(p5.CENTER, p5.TOP);
        p5.text(`Sell ${supply.good}`, pos.x, pos.y + renderable.radius + 5);
        p5.pop();
      }
      if (demand) {
        p5.push();
        p5.fill(0, 128, 0);
        p5.textAlign(p5.CENTER, p5.TOP);
        p5.text(`Buy ${demand.good} $${demand.reservationPrice}`, pos.x, pos.y + renderable.radius + 5);
        p5.pop();
      }

      // Hammer animation for constructing workers
      const constructionTask = world.getComponent(entity, 'ConstructionTask');
      if(constructionTask && constructionTask.constructing) {
        p5.push();
        // Position the hammer relative to the worker
        p5.translate(pos.x + renderable.radius, pos.y - renderable.radius);
        // Simple oscillating rotation to simulate hammer swing
        p5.rotate(sin(millis() * 0.01) * 0.5);
        p5.fill(120); // Hammer color
        // Draw hammer handle
        let handleWidth = renderable.radius/2;
        let handleHeight = renderable.radius/8;
        p5.rect(0, 0, handleWidth, handleHeight);
        // Draw hammer head attached to the end of the handle
        p5.rect(handleWidth, 0, handleWidth/2, handleHeight*3);
        p5.pop();
      }

      // Within the loop for each agent...
      if (job && inventory) {
        // Draw fishing rod, line, or other visual cues near the worker's position
        const b = world.getComponent(entity, 'Position');
        let rodX = b.x;
        let rodY = b.y;      // Start drawing from bottom center of building area
        let rodLength = 20;       // Use height as rod length

        p5.strokeWeight(1);
        p5.stroke(139, 69, 19);  // Brown color for rod
        //p5.strokeWeight(3);
        p5.line(rodX, rodY, rodX + rodLength/2, rodY - rodLength);
        
        p5.stroke(192, 192, 192);    // Silver color for line
        p5.line(rodX + rodLength/2, rodY, rodX + rodLength/2, rodY - rodLength);
        p5.strokeWeight(0);
      }
    }
  }
}
