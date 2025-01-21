// modules/logic/BubbleLogic.js

export function typewriteLine(followerComp, text, RandomRange, onDone) {
  // If we're already typing, skip or queue this line
  if (followerComp.speechBubble.typing) {
    //followerComp.speechBubble.queue.push({ text, onDone });
    //console.log(followerComp.speechBubble.queue);
    return; 
    // or if you want to queue it up, see "queue lines" below
  }

  // Mark as typing
  followerComp.speechBubble.typing = true;
  followerComp.speechBubble.visible = true;
  followerComp.speechBubble.done = false;
  followerComp.speechBubble.typed = "";
  followerComp.speechBubble.index = 0;

  const typingSpeed = 40; // ms between characters, for example

  // We'll do a simple interval-based approach 
  const intervalId = setInterval(() => {
    followerComp.speechBubble.index++;
    followerComp.speechBubble.typed = text.slice(0, followerComp.speechBubble.index);

    // Check if done
    if (followerComp.speechBubble.index >= text.length) {
      clearInterval(intervalId);
      followerComp.speechBubble.done = true;
      followerComp.speechBubble.typing = false;  // <-- Freed up for next line

      // You could optionally hide the bubble after some delay
      setTimeout(() => {
        followerComp.speechBubble.visible = false;
      }, 3000);

      // If you passed an onDone callback, fire it
      if (onDone) onDone();
    }
  }, typingSpeed);
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
