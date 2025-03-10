import { typewriteLine } from '../logic/BubbleLogic.js';
import { startBubbleSequence, startNextBubble } from '../logic/BubbleLogic.js';
import { isInFullyEnclosedRegion, houseHasUpgrades, isInGrassland, isInForest } from '../utils/EnvironmentUtils.js';
import { RandomRange } from '../utils/RandomRange.js';

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
      followerComp.randomLineInterval = RandomRange(3000, 10000);
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
        followerComp.randomLineInterval = RandomRange(3000, 10000);
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
    const followerPos = world.getComponent(followerEntity, 'Position');

    // Avoid cold lines if the follower is inside a forest
    if (!inHouse && !isInForest(followerPos)) {
      const lines = followerComp.coldLines;
      text = lines[RandomRange(0, lines.length - 1)];
    } else {
      const greenColors = ["#CAE3C3", "#ACDE9D", "#92D17E", "#77CA5B", "#56D527"];
      let lines;
      if (inHouse) {
        if (greenColors.includes(followerComp.color)) {
          lines = ["*cough*", "*sniffle*"];
        } else {
          const hasUpg = houseHasUpgrades(followerPos);
          lines = hasUpg
            ? [...followerComp.baseWarmLines, ...followerComp.upgradedWarmLines]
            : followerComp.baseWarmLines;
        }
      } else {
        // If not inHouse but inGrass or forest, fallback to cold lines outside forest
        lines = followerComp.coldLines;
      }
      text = lines[RandomRange(0, lines.length - 1)];
    }

    typewriteLine(followerComp, text, RandomRange);
  }

  // Start the multi-dialogue bubble sequence from bubbleMessages
  startBubbleSequence(followerComp) {
    startBubbleSequence(followerComp, (fc) => {
      startNextBubble(fc, RandomRange, () => {
        // Called after finishing all initial bubble messages
      });
    });
  }
}
