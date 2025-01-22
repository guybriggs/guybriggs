// modules/components/Follower.js
export function FollowerComponent(data = {}) {
  return {
    name: data.name || 'Follower',
    size: data.size || 8,
    color: data.color || 'white',
    faceColor: data.faceColor || 'black',
    followThreshold: data.followThreshold || 60,
    followStrength: data.followStrength || 0.05,
    dampening: data.dampening || 0.85,

    // Dialogue-related
    bubbleMessages: data.bubbleMessages || [
      { text: "Hey!",            delayStart: 3000, duration: 5000 },
      { text: "Wow, it's cold!", delayStart: 1000, duration: 5000 },
    ],
    currentBubbleIndex: -1,
    initialDialogsDone: false,
    lastRandomLineTime: 0,
    randomLineInterval: 0,

    // Possible sets of lines, or pass them in via data
    coldLines: data.coldLines || ["brrr...", "*achoo*", "Pneumonia, anyone?"],
    baseWarmLines: data.baseWarmLines || ["Ah, nice and warm.", "So Cosy!"],
    upgradedWarmLines: data.upgradedWarmLines || ["Immaculate!", "Home sweet home.", "Happiness looks like this."],

    // Bubble typing state
    speechBubble: {
      typed: "",
      index: 0,
      done: false,
      visible: false,
      xOffset: 0,
      yOffset: -25,
      bubbleColor: "white",
      textColor: "#444",
      font: "10px sans-serif",
      typedWidth: 0,
    },

    // For interval simulation
    bubbleInterval: null,
    saidApartmentLine: data.saidApartmentLine ?? false,
    typing: false,     // <--- NEW FLAG
    skip :false,
  };
}
