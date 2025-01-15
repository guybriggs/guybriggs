// modules/utils/FaceRenderer.js

import { EmotionTypes } from '../components/Emotion.js';

/**
 * Renders a face for an agent based on their emotion.
 * @param {Object} p5 - The p5.js instance.
 * @param {number} x - X-coordinate of the agent.
 * @param {number} y - Y-coordinate of the agent.
 * @param {number} size - Size of the agent.
 * @param {string} emotion - Current emotion of the agent.
 * @param {string} faceColor - Color used for facial features.
 */
export function drawFace(p5, x, y, size, emotion, faceColor = 'black') {
  p5.push();
  p5.translate(x, y);
  p5.noStroke();
  p5.fill(faceColor);
  
  // Eyes
  p5.ellipse(-size / 4, -size / 4, size / 5, size / 5); // Left eye
  p5.ellipse(size / 4, -size / 4, size / 5, size / 5);  // Right eye

  // Mouth based on emotion
  p5.stroke(faceColor);
  p5.strokeWeight(2);
  p5.noFill();
  
  switch (emotion) {
    case EmotionTypes.HAPPY:
      p5.arc(0, size / 8, size / 2.5, size / 3, 0, Math.PI);
      break;
    case EmotionTypes.SAD:
      p5.arc(0, size / 4, size / 2.5, size / 3, Math.PI, 0);
      break;
    case EmotionTypes.ANGRY:
      p5.line(-size / 4, size / 8 - size/1.5, -size / 8, size / 6 - size/1.5);
      p5.line(size / 4, size / 8 - size/1.5, size / 8, size / 6 - size/1.5);
      p5.line(-size / 4, size / 8, size / 4, size / 8);
      break;
    case EmotionTypes.WORRIED:
      p5.arc(0, size / 8, size / 2.5, size / 3, Math.PI / 4, (3 * Math.PI) / 4);
      break;
    case EmotionTypes.RELAXED:
      p5.line(-size / 4, size / 8, size / 4, size / 8);
      break;
    case EmotionTypes.STRESSED:
      p5.arc(0, size / 4, size / 2.5, size / 3, Math.PI, 0);
      break;
    case EmotionTypes.SICK:
      p5.push();
      p5.stroke(faceColor);
      p5.strokeWeight(2);
        
      // Draw droopy, half-closed eyes to depict sickness.
      p5.noFill();
      p5.arc(-size/4, -size/4, size/5, size/5, 0, Math.PI); 
      p5.arc(size/4, -size/4, size/5, size/5, 0, Math.PI);
        
      // Draw a drooping, uneasy mouth.
      p5.noFill();
      p5.arc(0, size/6, size/2, size/4, Math.PI, 0);
      
      // Draw a sweat drop to emphasize discomfort.
      p5.noStroke();
      p5.fill(173, 216, 230, 150); // pale blue for sweat
      p5.ellipse(-size/2, 0, size/10, size/20);
        
      p5.pop();
      break;
    case EmotionTypes.NEUTRAL:
    default:
      p5.line(-size / 4, size / 8, size / 4, size / 8);
      break;
  }

  p5.pop();
}
