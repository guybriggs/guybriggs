import { startBubbleSequence, startNextBubble, typewriteLine } from '../logic/BubbleLogic.js';
import { gatherEnclosedCells } from '../utils/BFSUtils.js';
import { tileMap } from '../tile/TileMap.js';
import { RandomRange } from '../utils/RandomRange.js';
import { isInFullyEnclosedRegion, getHouseWalls, isInGrassland, isInForest, houseHasUpgrades } from '../utils/EnvironmentUtils.js';

export class FollowerSystem {
  constructor() {
    this.worldWidth = 2000;
    this.worldHeight = 2000;
  }

  update(world, playerEntity) {
    const followerEntities = world.getEntitiesByComponent('Follower');
    if (followerEntities.length === 0) return;

    // We'll just handle the first Follower found for brevity
    const followerEntity = followerEntities[0];
    const followerComp = world.getComponent(followerEntity, 'Follower');
    const followerPos = world.getComponent(followerEntity, 'Position');
    const followerVel = world.getComponent(followerEntity, 'Velocity');
    if (!followerComp || !followerPos || !followerVel) return;
    if (followerComp.skip) return;

    // 1) If an apartment is now complete, say the special line if we haven't yet
    if (world.apartmentComplete && !followerComp.saidApartmentLine) {
      // Speak
      typewriteLine(
        followerComp,
        "I can't thank you enough! This place is amazing!",
        RandomRange
      );
      followerComp.saidApartmentLine = true;
    
      // Grab the stored tile from ApartmentSystem
      //   (assuming you set `world.apartmentInsideTile` above)
      const aptTile = world.apartmentInsideTile;
      if (aptTile) {
        const enclosedCells = gatherEnclosedCells(aptTile.gx, aptTile.gy);
        if (enclosedCells && enclosedCells.length > 0) {
          const randIndex = Math.floor(Math.random() * enclosedCells.length);
          const cell = enclosedCells[randIndex];
          // Teleport follower inside
          followerPos.x = cell.gx * 32 + 16;
          followerPos.y = cell.gy * 32 + 16;
        }
      }
    
      // Zero out velocity
      followerVel.vx = 0;
      followerVel.vy = 0;
    }
    
    if (world.hasComponent(followerEntity, 'Job')) {
      return; // let the job decide where they go
    }

    // 2) If the Follower has *already* said the line, we want them to stay in the house
    if (followerComp.saidApartmentLine) {
      this._houseRandomWander(world, followerPos, followerVel, followerComp);
      return;  // skip normal follow behavior
    }

    // 3) Otherwise, do the normal follow-the-player logic
    const playerPos = world.getComponent(playerEntity, 'Position');
    if (!playerPos) return;
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

  _houseRandomWander(world, followerPos, followerVel, followerComp) {
    // Use tile coords (gx, gy) under the follower
    const gx = Math.floor(followerPos.x / 32);  // or tileSize
    const gy = Math.floor(followerPos.y / 32);

    const enclosedCells = gatherEnclosedCells(gx, gy);
    // If null => region escapes => do a small random walk in place
    if (!enclosedCells) {
      this._randomSmallMove(followerPos, followerVel, followerComp);
      return;
    }
    
    // If BFS returned an empty array => can't pick a random tile
    if (enclosedCells.length === 0) {
      this._randomSmallMove(followerPos, followerVel, followerComp);
      return;
    }
    
    // If we haven't picked a roamTarget tile or we reached it, choose another
    if (
      !followerComp.roamTarget ||
      this._distanceToTile(followerPos, followerComp.roamTarget) < 5
    ) {
      const randomCell = enclosedCells[
        Math.floor(Math.random() * enclosedCells.length)
      ];
      // randomCell will no longer be undefined
      followerComp.roamTarget = { gx: randomCell.gx, gy: randomCell.gy };
    }

    // Now move toward that roamTarget
    const targetWorldX = followerComp.roamTarget.gx * 32 + 16; // center of tile
    const targetWorldY = followerComp.roamTarget.gy * 32 + 16;

    const dx = targetWorldX - followerPos.x;
    const dy = targetWorldY - followerPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      const speed = 0.3; // tweak as desired
      followerVel.vx = (dx / dist) * speed;
      followerVel.vy = (dy / dist) * speed;
    } else {
      // Arrived or very close => zero out velocity
      followerVel.vx *= 0.5;
      followerVel.vy *= 0.5;
    }

    // Finally, update the follower’s position
    followerPos.x += followerVel.vx;
    followerPos.y += followerVel.vy;
  }

  // If we can't find an enclosed region, at least let them do a small random wiggle
  _randomSmallMove(pos, vel, comp) {
    vel.vx += (Math.random() - 0.5) * 0.1;
    vel.vy += (Math.random() - 0.5) * 0.1;
    vel.vx *= 0.95;
    vel.vy *= 0.95;
    pos.x += vel.vx;
    pos.y += vel.vy;
  }

  _distanceToTile(pos, tile) {
    const tx = tile.gx * 32 + 16;
    const ty = tile.gy * 32 + 16;
    const dx = tx - pos.x;
    const dy = ty - pos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Existing follow logic
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
      // slow down if close
      followerVel.vx *= 0.5;
      followerVel.vy *= 0.5;
    }
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
