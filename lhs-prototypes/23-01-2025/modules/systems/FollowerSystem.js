// modules/systems/FollowerSystem.js

import { startBubbleSequence, startNextBubble, typewriteLine } from '../logic/BubbleLogic.js';
import { gatherEnclosedCells } from '../utils/BFSUtils.js';
import { tileMap } from '../tile/TileMap.js';
import { RandomRange } from '../utils/RandomRange.js';
import {
  isInFullyEnclosedRegion,
  getHouseWalls,
  isInGrassland,
  isInForest,
  houseHasUpgrades
} from '../utils/EnvironmentUtils.js';

export class FollowerSystem {
  constructor() {
    this.worldWidth = 2000;
    this.worldHeight = 2000;
  }

  update(world, playerEntity) {
    const followerEntities = world.getEntitiesByComponent('Follower');
    if (followerEntities.length === 0) return;
  
    // For simplicity, we only handle the first follower
    const followerEntity = followerEntities[0];
    const followerComp = world.getComponent(followerEntity, 'Follower');
    const followerPos = world.getComponent(followerEntity, 'Position');
    const followerVel = world.getComponent(followerEntity, 'Velocity');
    if (!followerComp || !followerPos || !followerVel) return;
    if (followerComp.skip) return;
  
    // 1) If the follower picks up a job => isDetached = true
    if (
      !followerComp.isDetached &&
      (world.hasComponent(followerEntity, 'Supply') ||
       world.hasComponent(followerEntity, 'Demand'))
    ) {
      followerComp.isDetached = true;
      console.log(`Follower ${followerComp.name} is now detached from movement!`);
      // No need to remove 'Follower' component; we keep it for money merges
    }
  
    // 2) If they're detached => skip follow movement
    if (followerComp.isDetached) {
      // They can still do other 'follower' things (like money merges).
      // But do not update movement => no follow logic
      return;
    }

    // 3) If an apartment is now complete, speak the line once
    if (world.apartmentComplete && !followerComp.saidApartmentLine) {
      typewriteLine(
        followerComp,
        "I can't thank you enough! This place is amazing!",
        RandomRange
      );
      followerComp.saidApartmentLine = true;
    
      // Possibly teleport inside the new apartment
      const aptTile = world.apartmentInsideTile;
      if (aptTile) {
        const enclosedCells = gatherEnclosedCells(aptTile.gx, aptTile.gy);
        if (enclosedCells && enclosedCells.length > 0) {
          const randIndex = Math.floor(Math.random() * enclosedCells.length);
          const cell = enclosedCells[randIndex];
          followerPos.x = cell.gx * 32 + 16;
          followerPos.y = cell.gy * 32 + 16;
        }
      }
      followerVel.vx = 0;
      followerVel.vy = 0;
    }

    // 4) If they've said the line => do house random wander
    if (followerComp.saidApartmentLine) {
      this._houseRandomWander(world, followerPos, followerVel, followerComp);
      return;
    }

    // 5) Normal follow-the-player logic
    const playerPos = world.getComponent(playerEntity, 'Position');
    if (!playerPos) return;
    this._updateMovement(playerPos, followerComp, followerPos, followerVel);

    // 6) Once initial dialogues done => random lines occasionally
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
        const playerEnclosed = isInFullyEnclosedRegion(playerPos);
        const followerEnclosed = isInFullyEnclosedRegion(followerPos);
        const inHouse = playerEnclosed || followerEnclosed;
        const inGrass = isInGrassland(followerPos);

        if (inHouse || inGrass) {
          this._sayRandomLine(world, followerEntity, inHouse);
        }

        followerComp.lastRandomLineTime = now;
        followerComp.randomLineInterval = RandomRange(3000, 10000);
      }
    }
  }

  _houseRandomWander(world, followerPos, followerVel, followerComp) {
    const gx = Math.floor(followerPos.x / 32);
    const gy = Math.floor(followerPos.y / 32);
    const enclosedCells = gatherEnclosedCells(gx, gy);

    if (!enclosedCells) {
      this._randomSmallMove(followerPos, followerVel, followerComp);
      return;
    }
    if (enclosedCells.length === 0) {
      this._randomSmallMove(followerPos, followerVel, followerComp);
      return;
    }
    
    if (
      !followerComp.roamTarget ||
      this._distanceToTile(followerPos, followerComp.roamTarget) < 5
    ) {
      const randomCell = enclosedCells[Math.floor(Math.random() * enclosedCells.length)];
      followerComp.roamTarget = { gx: randomCell.gx, gy: randomCell.gy };
    }

    const targetWorldX = followerComp.roamTarget.gx * 32 + 16;
    const targetWorldY = followerComp.roamTarget.gy * 32 + 16;

    const dx = targetWorldX - followerPos.x;
    const dy = targetWorldY - followerPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      const speed = 0.3;
      followerVel.vx = (dx / dist) * speed;
      followerVel.vy = (dy / dist) * speed;
    } else {
      followerVel.vx *= 0.5;
      followerVel.vy *= 0.5;
    }
    followerPos.x += followerVel.vx;
    followerPos.y += followerVel.vy;
  }

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
      const hasUpg = houseHasUpgrades(followerPos);
      if (inHouse) {
        // Possibly do "warm lines" if inside
        text = hasUpg
          ? [...followerComp.baseWarmLines, ...followerComp.upgradedWarmLines][
              RandomRange(0, followerComp.baseWarmLines.length + followerComp.upgradedWarmLines.length - 1)
            ]
          : followerComp.baseWarmLines[
              RandomRange(0, followerComp.baseWarmLines.length - 1)
            ];
      } else {
        // If not inHouse but in grass or forest => cold lines
        text = followerComp.coldLines[RandomRange(0, followerComp.coldLines.length - 1)];
      }
    }

    typewriteLine(followerComp, text, RandomRange);
  }

  startBubbleSequence(followerComp) {
    startBubbleSequence(followerComp, (fc) => {
      startNextBubble(fc, RandomRange, () => {
        // Called after finishing all initial bubble messages
      });
    });
  }
}
