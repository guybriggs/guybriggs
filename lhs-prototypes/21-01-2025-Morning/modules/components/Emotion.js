// modules/components/Emotion.js

export const EmotionTypes = {
  HAPPY: 'Happy',
  SAD: 'Sad',
  ANGRY: 'Angry',
  RELAXED: 'Relaxed',
  NEUTRAL: 'Neutral',
  WORRIED: 'Worried',
  SAD: 'Sad',
  STRESSED: 'Stressed',
  SICK: 'Sick',
};

export const EmotionColors = {
  Happy: 'yellow',
  Sad: 'blue',
  Angry: 'red',
  Relaxed: 'green',
  Neutral: 'gray',
  Worried: 'orange',
  Stressed: 'purple',
  Sick: 'brown',
};

export function getEmotionColor(emotionType) {
  return EmotionColors[emotionType] || 'white'; // Default to white if emotion not found
}

export function EmotionComponent(type) {
  return { type };
}

export function getRandomEmotion() {
  const emotionKeys = Object.keys(EmotionTypes); // Get all emotion keys
  const randomIndex = Math.floor(Math.random() * emotionKeys.length); // Random index
  const randomKey = emotionKeys[randomIndex]; // Select a random key
  return EmotionTypes[randomKey]; // Return the corresponding emotion
}