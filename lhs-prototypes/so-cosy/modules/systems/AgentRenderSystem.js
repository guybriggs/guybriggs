// modules/systems/AgentRenderSystem.js

import { EmotionTypes } from '../components/Emotion.js';
import { drawFace } from '../utils/FaceRenderer.js';

export class AgentRenderSystem {
  update(world, p5) {
    // Retrieve all entities with the 'Renderable' and 'Position' components
    const renderableEntities = world.getEntitiesByComponents(['Renderable', 'Position', 'Name', 'Emotion']);

    for (let entity of renderableEntities) {
      const renderable = world.getComponent(entity, 'Renderable');
      const pos = world.getComponent(entity, 'Position');
      const name = world.getComponent(entity, 'Name');
      const emotion = world.getComponent(entity, 'Emotion');
      const demand = world.getComponent(entity, 'Demand'); // Get Supply component if exists
      const supply = world.getComponent(entity, 'Supply'); // Get Supply component if exists

      if (!renderable || !pos || !name || !emotion) continue;

      // **Draw the agent's body**
      p5.push();
      p5.noStroke();
      // Differentiate suppliers by color
      if (supply) {
        p5.fill('green'); // Color for suppliers
      } else if(demand) {
        p5.fill('orange');
      } else {
        p5.fill(renderable.color);
      }
      p5.ellipse(pos.x, pos.y, renderable.radius * 2, renderable.radius * 2);
      p5.pop();

      // **Draw the agent's face based on emotion**
      drawFace(p5, pos.x, pos.y, renderable.radius, emotion.type, 'black');

      // **Draw the agent's name above their head**
      p5.push();
      p5.fill(0);
      p5.textAlign(p5.CENTER, p5.BOTTOM);
      p5.text(name.name, pos.x, pos.y - renderable.radius - 10);
      p5.pop();

      // **(Optional) Display Supply data above the agent**
      if (supply) {
        p5.push();
        p5.fill(0, 128, 0);
        p5.textAlign(p5.CENTER, p5.TOP);
        p5.text(`Sell ${supply.good}`, pos.x, pos.y + renderable.radius + 5);
        p5.pop();
      }

      // **(Optional) Display Supply data above the agent**
      if (demand) {
        p5.push();
        p5.fill(0, 128, 0);
        p5.textAlign(p5.CENTER, p5.TOP);
        p5.text(`Buy ${demand.good} $${demand.reservationPrice}`, pos.x, pos.y + renderable.radius + 5);
        p5.pop();
      }
    }
  }
}
