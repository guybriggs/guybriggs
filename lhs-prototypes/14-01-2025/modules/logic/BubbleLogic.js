// modules/logic/BubbleLogic.js

export function typewriteLine(followerComp, text, randomRangeFn) {
    if (followerComp.bubbleInterval) clearInterval(followerComp.bubbleInterval);
  
    const bubble = followerComp.speechBubble;
    bubble.typed = "";
    bubble.index = 0;
    bubble.done = false;
    bubble.visible = true;
  
    const perCharDelay = 50;
    followerComp.bubbleInterval = setInterval(() => {
      if (bubble.index < text.length) {
        bubble.typed += text.charAt(bubble.index);
        bubble.index++;
        bubble.typedWidth = bubble.typed.length * 6; 
      } else {
        bubble.done = true;
        clearInterval(followerComp.bubbleInterval);
      }
    }, perCharDelay);
  
    // Hide after 2 seconds
    setTimeout(() => {
      bubble.visible = false;
      clearInterval(followerComp.bubbleInterval);
    }, 2000);
  }
  
  export function startBubbleSequence(followerComp, startNextBubbleFn) {
    followerComp.currentBubbleIndex = -1;
    startNextBubbleFn(followerComp);
  }
  
  export function startNextBubble(followerComp, randomRangeFn, callback) {
    followerComp.currentBubbleIndex++;
    if (followerComp.currentBubbleIndex >= followerComp.bubbleMessages.length) {
      followerComp.speechBubble.visible = false;
      if (callback) callback(); 
      return;
    }
    const message = followerComp.bubbleMessages[followerComp.currentBubbleIndex];
    const bubble = followerComp.speechBubble;
  
    bubble.typed = "";
    bubble.index = 0;
    bubble.done = false;
    bubble.visible = false;
  
    setTimeout(() => {
      bubble.visible = true;
      if (followerComp.bubbleInterval) clearInterval(followerComp.bubbleInterval);
  
      const perCharDelay = 50;
      followerComp.bubbleInterval = setInterval(() => {
        if (bubble.index < message.text.length) {
          bubble.typed += message.text.charAt(bubble.index);
          bubble.index++;
          bubble.typedWidth = bubble.typed.length * 6;
        } else {
          bubble.done = true;
          clearInterval(followerComp.bubbleInterval);
        }
      }, perCharDelay);
  
      setTimeout(() => {
        bubble.visible = false;
        clearInterval(followerComp.bubbleInterval);
        startNextBubble(followerComp, randomRangeFn, callback);
      }, message.duration);
    }, message.delayStart);
  }
  