// modules/systems/TalkInteractionSystem.js

import { typewriteLine } from '../logic/BubbleLogic.js';
import { 
  getRandomWorkerLine,
  getRandomConsumerLine,
  getRandomPriceyWorkerLine,
  getRandomOtherLine 
} from '../data/DialoguePresets.js';

// Decide which line to use for an agent
function getLineForAgent(world, agent) {
  const isWorker = world.hasComponent(agent, 'Worker');
  const isConsumer = world.hasComponent(agent, 'Demand');

  if (isWorker) {
    const supply = world.getComponent(agent, 'Supply');
    if (supply && supply.reservationPrice > 30) {
      return getRandomPriceyWorkerLine();
    }
    return getRandomWorkerLine();
  }
  if (isConsumer) {
    return getRandomConsumerLine();
  }
  return getRandomOtherLine();
}

// Ensure SpeechBubble component
function ensureSpeechBubble(world, entity, {
  bubbleColor = 'white',
  textColor = '#ffffff',
  xOffset = 0,
  yOffset = -40
} = {}) {
  let bubble = world.getComponent(entity, 'SpeechBubble');
  if (!bubble) {
    world.addComponent(entity, 'SpeechBubble', {
      fullText: "",
      typed: "",
      index: 0,
      visible: false,
      xOffset,
      yOffset,
      bubbleColor,
      textColor,
      typing: false,
      queue: []
    });
    bubble = world.getComponent(entity, 'SpeechBubble');
  }
  return bubble;
}

export class TalkInteractionSystem {
  constructor(interactRadius = 10) {
    this.interactRadius = interactRadius;
  }

  attemptTalk(world, playerEntity) {
    const playerPos = world.getComponent(playerEntity, 'Position');
    if (!playerPos) return;

    // Find the closest agent
    const agents = world.getEntitiesByComponents(['Position', 'Name']);
    let nearest = null;
    let minDist = Infinity;

    for (const agent of agents) {
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
    if (!nearest) return;

    const line = getLineForAgent(world, nearest);
    speakLine(world, nearest, line);
  }
}

// One-off speech
export function oneOffTalk(world, entity, line, opts = {}) {
  speakLine(world, entity, line, opts);
}

// Shared speakLine logic
function speakLine(world, entity, line, {
  bubbleColor = 'white',
  textColor = '#ffffff',
  xOffset = 0,
  yOffset = -40,
  autoHide = true,         // <--- auto-hide by default
  hideDelay = 3000         // <--- 3 seconds after done typing
} = {}) {
  // If there's already a bubble & it's typing, don't overwrite
  let speechBubble = world.getComponent(entity, 'SpeechBubble');
  if (speechBubble && speechBubble.typing) return;

  // Otherwise, ensure bubble
  speechBubble = ensureSpeechBubble(world, entity, {
    bubbleColor,
    textColor,
    xOffset,
    yOffset
  });
  
  // Reset text
  speechBubble.fullText = line;
  speechBubble.typed = "";
  speechBubble.index = 0;
  speechBubble.visible = true;

  // Start typewriting
  typewriteLine({ speechBubble, bubbleInterval: null }, line, Math.random, () => {
    // Typewriting is done
    if (autoHide) {
      // Hide the bubble after X ms
      setTimeout(() => {
        speechBubble.visible = false;
      }, hideDelay);
    }
  });
}
