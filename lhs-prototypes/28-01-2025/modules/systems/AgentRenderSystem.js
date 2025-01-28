// modules/systems/AgentRenderSystem.js

import { EmotionTypes } from '../components/Emotion.js';
import { tileMap, tileSize, mapRows, mapCols } from '../tile/TileMap.js';
import { drawFace } from '../utils/FaceRenderer.js';
import { Goods } from '../data/Goods.js';

/**
 * The AgentRenderSystem draws entities with:
 *   - 'Renderable'
 *   - 'Position'
 *   - 'Name'
 *   - 'Emotion'
 *
 * It also includes logic for supply/demand hats, crates overhead,
 * pitchfork for farmers, etc. 
 * The Chef bounces ONLY when in 'FRYING' state.
 */
export class AgentRenderSystem {
  update(world, p5) {
    // 1) Gather all entities that have the four main components
    const renderableEntities = world.getEntitiesByComponents(
      ['Renderable', 'Position', 'Name', 'Emotion']
    );

    for (let entity of renderableEntities) {
      // --------------------------------------------------------
      // 2) Get each relevant component
      // --------------------------------------------------------
      const renderable = world.getComponent(entity, 'Renderable');
      const pos        = world.getComponent(entity, 'Position');
      const name       = world.getComponent(entity, 'Name');
      const emotion    = world.getComponent(entity, 'Emotion');
      if (!renderable || !pos || !name || !emotion) continue;

      // Optional additional components
      const vel       = world.getComponent(entity, 'Velocity');
      const supply    = world.getComponent(entity, 'Supply');
      const demand    = world.getComponent(entity, 'Demand');
      const inventory = world.getComponent(entity, 'Inventory');
      const follower  = world.getComponent(entity, 'Follower');

      // --------------------------------------------------------
      // 3) Wrap drawing for this entity in a push/pop
      // --------------------------------------------------------
      p5.push();

      // Move our origin to the entity's world position:
      p5.translate(pos.x, pos.y);

      // --------------------------------------------------------
      // 4) If this is a Chef *and* in FRYING state => small bounce
      //    This does NOT affect pos.x/pos.y in logic, only drawing.
      // --------------------------------------------------------
      if (
        supply &&
        supply.good === Goods.CHEF_WORK &&
        supply.chefState === 'FRYING'
      ) {
        const jumpOffset = Math.sin(p5.millis() * 0.01) * 5;
        p5.translate(0, jumpOffset);
      }

      // We'll treat (0,0) as the agent's center for the rest of the drawing.
      const r = renderable.radius || 8;

      // --------------------------------------------------------
      // 5) Draw the main body (circle) in local coords
      // --------------------------------------------------------
      p5.push();
      p5.noStroke();

      // Decide fill color
      if (follower) {
        // If it's a follower
        if (follower.isDetached) {
          p5.fill('hotpink'); // e.g. bright pink if they've taken a job
        } else {
          p5.fill(renderable.color || 'white');
        }
      }
      else if (renderable.helmet && renderable.helmetColor === 'red') {
        p5.fill('#E38A8A'); // red-helmet occupant
      }
      else if (renderable.helmet) {
        p5.fill('#E3E763'); // normal worker helmet occupant
      }
      else if (supply) {
        p5.fill('green'); // supply => green
      }
      else if (demand) {
        p5.fill('orange'); // demand => orange
      }
      else {
        p5.fill(renderable.color || 'white'); // default
      }

      // Actually draw the circle at local (0,0)
      p5.ellipse(0, 0, r * 2, r * 2);
      p5.pop();

      // --------------------------------------------------------
      // 6) If the agent has a Demand => draw small coin 
      //    at bottom-right of the circle
      // --------------------------------------------------------
      if (demand) {
        const coinOffsetX = r; 
        const coinOffsetY = r; 
        const coinRadius  = 12;

        p5.push();
        p5.fill('#FCF92F'); // gold
        p5.noStroke();
        p5.circle(coinOffsetX, coinOffsetY, coinRadius);

        // Draw dollar sign
        p5.fill(0);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(8);
        p5.text('$', coinOffsetX, coinOffsetY + 0.5);
        p5.pop();
      }

      // --------------------------------------------------------
      // 7) If agent has a "helmet" => draw an arc on top
      //    (We've already used that for building/worker logic)
      // --------------------------------------------------------
      if (renderable.helmet) {
        p5.push();
        p5.fill(renderable.helmetColor || 'yellow');
        p5.noStroke();
        // Arc above the circle
        p5.arc(
          0,
          -r, 
          r * 1.4,
          r,
          Math.PI,
          2 * Math.PI
        );
        p5.pop();
      }

      // --------------------------------------------------------
      // 8) Additional "job" hats or icons
      // --------------------------------------------------------

      // (A) Assistant hat
      if (supply && supply.good === Goods.ASSISTANT_WORK) {
        p5.push();
        p5.fill('white');
        p5.noStroke();
        const hatW = r;
        const hatH = r * 0.8;
        // Arc just above the circle
        p5.arc(
          0,
          -r * 0.9,
          hatW,
          hatH,
          Math.PI,
          2 * Math.PI
        );
        p5.pop();
      }

      // (B) Stockroom assistant => small crate overhead
      if (supply && supply.good === Goods.STOCKROOM_ASSISTANT) {
        p5.push();
        const crateY = -r - 15;
        p5.fill('#8B4513'); 
        p5.noStroke();
        p5.rectMode(p5.CENTER);
        p5.rect(0, crateY, 12, 12);
        p5.stroke(0);
        p5.line(-5, crateY - 2, 5, crateY - 2); 
        p5.line(-5, crateY + 2, 5, crateY + 2); 
        p5.pop();
      }

      // (C) Farmer => pitchfork
      if (supply && supply.good === Goods.FARM_WORK) {
        p5.push();
        // Move a bit to the right of the circle
        p5.translate(r, -r * 0.5);

        // Optionally wiggle if on own potato_seed tile
        let upDown = 0;
        const col = Math.floor(pos.x / tileSize);
        const row = Math.floor(pos.y / tileSize);
        if (
          row >= 0 && row < mapRows &&
          col >= 0 && col < mapCols
        ) {
          const tile = tileMap[row][col];
          if (tile.type === 'potato_seed' && tile.claimed === entity) {
            // Wiggle up/down 
            upDown = Math.sin(p5.millis() * 0.005) * 3;
          }
        }
        p5.translate(0, upDown);

        // Draw pitchfork
        p5.stroke('#A9A9A9');
        p5.strokeWeight(2);
        // handle
        p5.line(0, 0, 0, 20);
        // crossbar
        p5.line(-6, 20, 6, 20);
        // tines
        p5.line(-4, 20, -4, 30);
        p5.line(0, 20, 0, 30);
        p5.line(4, 20, 4, 30);

        p5.pop();
      }

      // (D) Fisher => fishing rod
      if (supply && supply.good === Goods.FISH_WORK) {
        p5.push();
        p5.stroke('#4e2b15');
        p5.strokeWeight(3);
        // We'll draw a small line to the top-right
        const rodStartX = r;
        const rodStartY = 0;
        p5.line(rodStartX, rodStartY, rodStartX + 10, rodStartY - 10);
        p5.pop();
      }

      // (E) Fish-seller => light-blue arc
      if (supply && supply.good === Goods.FISH) {
        p5.push();
        p5.fill('#82c8fa');
        p5.noStroke();
        const capW = r;
        const capH = r * 0.8;
        p5.arc(
          0,
          -r * 0.9,
          capW,
          capH,
          Math.PI,
          2 * Math.PI
        );
        p5.pop();
      }

      // (F) Chef => small "chef hat"
      if (supply && supply.good === Goods.CHEF_WORK) {
        p5.push();
        p5.fill('white');
        p5.noStroke();
        const hatW = r * 1.5;
        const hatH = r * 0.8;
        // Arc portion above the circle
        p5.arc(
          0,
          -r,
          hatW,
          hatH,
          Math.PI,
          2 * Math.PI
        );
        // band below arc
        p5.rectMode(p5.CENTER);
        p5.rect(0, -r, hatW, r * 0.3);
        p5.pop();
      }

      // --------------------------------------------------------
      // 9) If inventory has certain crops => show overhead
      // --------------------------------------------------------
      if (inventory) {
        const cropTypes = ['potato','carrot','corn','rice'];
        for (let ct of cropTypes) {
          const count = inventory.items[ct] || 0;
          if (count > 0) {
            p5.push();
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.textSize(14);
            p5.fill(255);

            let emoji = '🥔'; // default
            if (ct === 'carrot') emoji = '🥕';
            if (ct === 'corn')   emoji = '🌽';
            if (ct === 'rice')   emoji = '🌾';

            p5.text(emoji, 0, -r - 15);
            p5.pop();
          }
        }
      }

      // Also if fisher is carrying fish => show a fish overhead
      if (supply && supply.good === Goods.FISH_WORK && inventory) {
        const fishCount = inventory.items.fish || 0;
        if (fishCount > 0) {
          p5.push();
          p5.textAlign(p5.CENTER, p5.CENTER);
          p5.textSize(14);
          p5.fill('#f2b300');
          p5.noStroke();
          p5.text('🐟', 0, -r - 15);
          p5.pop();
        }
      }

      // --------------------------------------------------------
      // 10) Draw the face (in local coords)
      // --------------------------------------------------------
      drawFace(p5, 0, 0, r, emotion.type, 'black');

      // --------------------------------------------------------
      // 11) Draw the agent's name above the circle
      // --------------------------------------------------------
      p5.push();
      p5.fill('#000000');
      p5.textAlign(p5.CENTER, p5.BOTTOM);
      p5.textSize(6);
      p5.text(name.firstName, 0, -r - 10);
      p5.pop();

      // --------------------------------------------------------
      // 12) If there's a SpeechBubble => draw it
      // --------------------------------------------------------
      const speechBubble = world.getComponent(entity, 'SpeechBubble');
      if (speechBubble && speechBubble.visible) {
        p5.push();
        p5.textSize(10);
        p5.fill(speechBubble.bubbleColor || 'white');
        p5.noStroke();

        const typed = speechBubble.typed;
        const textW = p5.textWidth(typed) + 6;
        const bubbleH = 15;
        // place bubble above the entity's circle
        const bubbleX = -textW / 2;
        const bubbleY = -r - bubbleH - 20;

        p5.rect(bubbleX, bubbleY, textW, bubbleH, 4);
        p5.fill('#232323');
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(8);
        p5.text(typed, bubbleX + textW / 2, bubbleY + bubbleH / 2);
        p5.pop();
      }

      // --------------------------------------------------------
      // 13) If supply => show the supply price below the circle
      // --------------------------------------------------------
      if (supply) {
        p5.push();
        p5.fill('#000000');
        p5.textAlign(p5.CENTER, p5.TOP);
        p5.textSize(6);
        const price = supply.reservationPrice || 0;
        p5.text(`$${price}`, 0, r + 5);
        p5.pop();
      }

      // --------------------------------------------------------
      // 14) If demand => show demand price below
      // --------------------------------------------------------
      if (demand) {
        p5.push();
        p5.fill('#000000');
        p5.textAlign(p5.CENTER, p5.TOP);
        p5.textSize(6);
        const price = demand.reservationPrice || 0;
        p5.text(`$${price}`, 0, r + 5);
        p5.pop();
      }

      // --------------------------------------------------------
      // 15) If this agent is constructing => show hammer anim
      // --------------------------------------------------------
      const constructionTask = world.getComponent(entity, 'ConstructionTask');
      if (constructionTask && constructionTask.constructing) {
        p5.push();
        // e.g. place hammer to the top-right
        p5.translate(r, -r);
        // rotate it back/forth
        p5.rotate(Math.sin(p5.millis() * 0.01) * 0.5);
        p5.fill(120);
        const hw = r / 2;
        const hh = r / 8;
        p5.rect(0, 0, hw, hh);
        p5.rect(hw, 0, hw / 2, hh * 3);
        p5.pop();
      }

      // Done with this entity
      p5.pop();
    }
  }
}
