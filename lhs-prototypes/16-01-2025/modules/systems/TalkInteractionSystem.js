// modules/systems/TalkInteractionSystem.js

import { typewriteLine } from '../logic/BubbleLogic.js';
import { 
  getRandomWorkerLine, 
  getRandomConsumerLine, 
  getRandomPriceyWorkerLine, 
  getRandomOtherLine 
} from '../data/DialoguePresets.js';

export class TalkInteractionSystem {
  constructor(interactRadius = 100) {
    this.interactRadius = interactRadius;
  }

  attemptTalk(world, playerEntity) {
    const playerPos = world.getComponent(playerEntity, 'Position');
    if (!playerPos) return;

    // 1) Find the closest agent
    const agents = world.getEntitiesByComponents(['Position']);
    let nearest = null;
    let minDist = Infinity;

    for (let agent of agents) {
      if (agent === playerEntity) continue;
      const pos = world.getComponent(agent, 'Position');
      if (!pos) continue;
      const dx = pos.x - playerPos.x;
      const dy = pos.y - playerPos.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < this.interactRadius * this.interactRadius && distSq < minDist) {
        minDist = distSq;
        nearest = agent;
      }
    }
    if (!nearest) return; // No agent close enough

    // 2) Decide line based on the agent’s components
    const isWorker = world.hasComponent(nearest, 'Worker');
    const isDemand = world.hasComponent(nearest, 'Demand');

    // If a worker has Supply with reservationPrice>30, we treat them as "pricey"
    let line;
    if (isWorker) {
      const supplyComp = world.getComponent(nearest, 'Supply');
      if (supplyComp && supplyComp.reservationPrice > 30) {
        // Use the “pricey worker” lines
        line = getRandomPriceyWorkerLine();
      } else {
        line = getRandomWorkerLine();
      }
    } else if (isDemand) {
      // Normal consumer lines
      line = getRandomConsumerLine();
    } else {
      // Anything else
      line = getRandomOtherLine();
    }

    // 3) Ensure a SpeechBubble
    let speechBubble = world.getComponent(nearest, 'SpeechBubble');
    if (!speechBubble) {
      world.addComponent(nearest, 'SpeechBubble', {
        textOptions: [],
        fullText: "",
        typed: "",
        index: 0,
        visible: false,
        xOffset: 0,
        yOffset: -40,
        bubbleColor: 'white',
        textColor: '#ffffff',
        typing: false,
        queue: []
      });
      speechBubble = world.getComponent(nearest, 'SpeechBubble');
    }

    // 4) Reset bubble & type
    speechBubble.fullText = line;
    speechBubble.typed = "";
    speechBubble.index = 0;
    speechBubble.visible = true;

    // 5) Use typewriteLine
    typewriteLine(
      { speechBubble, bubbleInterval: null },
      line,
      Math.random, // or any random function you want
      () => {}
    );
  }
}
