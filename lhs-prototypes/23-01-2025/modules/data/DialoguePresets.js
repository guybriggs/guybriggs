// modules/data/DialoguePresets.js
// Keep it short—under 30 lines.

export const workerLines = [
    "Need to build something?",
    "I'm on break.",
    "Heave ho!",
    "I prefer higher wages.",
    "Time for tea break."
  ];
  
  export const consumerLines = [
    "I just love shopping!",
    "Where can I buy fish?",
    "That store is overpriced!",
    "What's for dinner...",
    "Do you sell keys here?"
  ];

  // New lines for pricey workers:
    const priceyLines = [
    "Awful wages!",
    "Your wages are daylight robbery.",
    "Come on...",
    "*glare*"
  ];

  export const otherLines = [
    "Hello there!",
    "G'Day!",
    "How's it hangin'?",
    "What's on your mind?",
    "I hear some birds!",
    "The ocean is beautiful today!",
    "I love to walk in the forest.",
    "Have you seen my dog?",
    "My dad works as a construction worker! I hope he gets a job today!",
    "*meow*",
    "I lost my watch in a grassy field, have you seen it?",
  ];
  
  export function getRandomWorkerLine() {
    return workerLines[Math.floor(Math.random() * workerLines.length)];
  }
  
  export function getRandomConsumerLine() {
    return consumerLines[Math.floor(Math.random() * consumerLines.length)];
  }

  export function getRandomPriceyWorkerLine() {
    return priceyLines[Math.floor(Math.random() * priceyLines.length)];
  }

  export function getRandomOtherLine() {
    return otherLines[Math.floor(Math.random() * otherLines.length)];
  }