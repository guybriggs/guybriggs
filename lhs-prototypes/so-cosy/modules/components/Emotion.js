// modules/components/Emotion.js

export const EmotionTypes = {
  HAPPY: 'Happy',
  SAD: 'Sad',
  ANGRY: 'Angry',
  RELAXED: 'Relaxed',
  NEUTRAL: 'Neutral',
  WORRIED: 'Worried',
  SAD: 'Sad',
  // Add more emotions as needed
};

/**
 * Factory function to create an Emotion component.
 * @param {string} type - The type of emotion.
 * @returns {Object} The Emotion component.
 */
export function EmotionComponent(type) {
  return { type };
}
