// modules/systems/FollowerSystem.js
import { typewriteLine } from '../logic/BubbleLogic.js';
import { startBubbleSequence, startNextBubble } from '../logic/BubbleLogic.js';
import { isInFullyEnclosedRegion, houseHasUpgrades, isInGrassland } from '../utils/EnvironmentUtils.js';
import { randomRange } from '../utils/randomRange.js';

export class FollowerSystem {
  constructor() {
    this.worldWidth = 2000;
    this.worldHeight = 2000;
  }

  update(world, playerEntity) {
    const playerPos = world.getComponent(playerEntity, 'Position');
    if (!playerPos) return;

    // We handle the first follower entity found
    const followerEntities = world.getEntitiesByComponent('Follower');
    if (followerEntities.length === 0) return;
    const followerEntity = followerEntities[0];

    // Grab the follower data
    const followerComp = world.getComponent(followerEntity, 'Follower');
    const followerPos = world.getComponent(followerEntity, 'Position');
    const followerVel = world.getComponent(followerEntity, 'Velocity');
    if (!followerComp || !followerPos || !followerVel) return;

    // 1) Move the follower
    this._updateMovement(playerPos, followerComp, followerPos, followerVel);

    // 2) Once initial dialogues are done, do random lines
    if (
      !followerComp.initialDialogsDone &&
      followerComp.currentBubbleIndex >= followerComp.bubbleMessages.length
    ) {
      followerComp.initialDialogsDone = true;
      followerComp.randomLineInterval = randomRange(3000, 10000);
      followerComp.lastRandomLineTime = Date.now();
    }

    if (followerComp.initialDialogsDone) {
      const now = Date.now();
      if (now - followerComp.lastRandomLineTime > followerComp.randomLineInterval) {
        // Check if EITHER the player OR the follower is enclosed
        const playerEnclosed = isInFullyEnclosedRegion(playerPos);
        const followerEnclosed = isInFullyEnclosedRegion(followerPos);

        // If either is enclosed => use house lines
        const inHouse = playerEnclosed || followerEnclosed;
        // Otherwise, if not enclosed, check if follower is in grassland
        const inGrass = isInGrassland(followerPos);

        // If inHouse or inGrass => speak a line
        if (inHouse || inGrass) {
          this._sayRandomLine(world, followerEntity, inHouse);
        }

        followerComp.lastRandomLineTime = now;
        followerComp.randomLineInterval = randomRange(3000, 10000);
      }
    }
  }

  _updateMovement(playerPos, followerComp, followerPos, followerVel) {
    const dx = playerPos.x - followerPos.x;
    const dy = playerPos.y - followerPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > followerComp.followThreshold) {
      const ax = dx * followerComp.followStrength;
      const ay = dy * followerComp.followStrength;
      followerVel.vx += ax;
      followerVel.vy += ay;
      followerVel.vx *= followerComp.dampening;
      followerVel.vy *= followerComp.dampening;
    } else {
      // Slow if close
      followerVel.vx *= 0.5;
      followerVel.vy *= 0.5;
    }

    // Update follower position
    followerPos.x += followerVel.vx;
    followerPos.y += followerVel.vy;
  }

  _sayRandomLine(world, followerEntity, inHouse) {
    const followerComp = world.getComponent(followerEntity, 'Follower');
    if (!followerComp) return;

    let text;
    if (!inHouse) {
      // Use "cold" lines
      const lines = followerComp.coldLines;
      text = lines[randomRange(0, lines.length - 1)];
    } else {
      // Use "warm" lines
      // If houseHasUpgrades(...) => pick from upgradedWarmLines
      const followerPos = world.getComponent(followerEntity, 'Position');
      const hasUpg = houseHasUpgrades(followerPos); 
      const lines = hasUpg
        ? [...followerComp.baseWarmLines, ...followerComp.upgradedWarmLines]
        : followerComp.baseWarmLines;
      text = lines[randomRange(0, lines.length - 1)];
    }

    typewriteLine(followerComp, text, randomRange);
  }

  // Start the multi-dialogue bubble sequence from bubbleMessages
  startBubbleSequence(followerComp) {
    startBubbleSequence(followerComp, (fc) => {
      startNextBubble(fc, randomRange, () => {
        // Called after finishing all initial bubble messages
      });
    });
  }
}
