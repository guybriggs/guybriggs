// modules/systems/CollisionSystem.js

import { tileMap, tileSize, mapRows, mapCols } from '../tile/TileMap.js';

export class CollisionSystem {
  constructor(playerEntity) {
    this.playerEntity = playerEntity; // reference to the player entity
  }

  update(world) {
    // Get all entities with Position and Velocity components
    const entities = world.getEntitiesWith('Position', 'Velocity');

    for (const entity of entities) {
      const pos = world.getComponent(entity, 'Position');
      const vel = world.getComponent(entity, 'Velocity');
      if (!pos || !vel) continue;

      // Determine if this entity is the player for special handling
      const isPlayer = (entity === this.playerEntity);

      // Proposed new position
      const proposedX = pos.x + vel.vx;
      const proposedY = pos.y + vel.vy;

      if (!isPlayer) {
        // Simple collision for NPCs
        this.handleSimpleCollision(proposedX, proposedY, vel);
      } else {
        // Separate axis collision for the player
        this.handlePlayerCollision(pos, vel);
      }
    }
  }

  handleSimpleCollision(proposedX, proposedY, vel) {
    const col = Math.floor(proposedX / tileSize);
    const row = Math.floor(proposedY / tileSize);

    // 1) Boundary check first
    if (row < 0 || col < 0 || row >= mapRows || col >= mapCols) {
      // Out of bounds => stop movement
      vel.vx = 0;
      vel.vy = 0;
      return;
    }

    // 2) Then read tile
    const tile = tileMap[row][col];
    if (tile?.transparent) {
      // If it’s “transparent” (e.g. a blueprint), no collision
      return;
    }

    // Otherwise if it’s a wall or stone_bricks => stop
    if (tile?.type === 'wall' || tile?.type === 'stone_bricks') {
      vel.vx = 0;
      vel.vy = 0;
    }
  }

  handlePlayerCollision(pos, vel) {
    // -------- Horizontal check --------
    const newX = pos.x + vel.vx;
    const colX = Math.floor(newX / tileSize);
    const rowCurrent = Math.floor(pos.y / tileSize);

    // 1) Boundary check
    if (colX < 0 || rowCurrent < 0 || colX >= mapCols || rowCurrent >= mapRows) {
      // out of bounds => block horizontal movement
      vel.vx = 0;
    } else {
      // 2) Tile check
      const tileH = tileMap[rowCurrent][colX];
      if (tileH?.type === 'wall' || tileH?.type === 'stone_bricks') {
        // If the tile is transparent => allow passing
        if (tileH.transparent) return;
        // Otherwise block
        vel.vx = 0;
      }
    }

    // -------- Vertical check --------
    const newY = pos.y + vel.vy;
    const rowY = Math.floor(newY / tileSize);
    const colCurrent = Math.floor(pos.x / tileSize);

    // 1) Boundary check
    if (rowY < 0 || colCurrent < 0 || rowY >= mapRows || colCurrent >= mapCols) {
      vel.vy = 0;
    } else {
      // 2) Tile check
      const tileV = tileMap[rowY][colCurrent];
      if (tileV?.type === 'wall' || tileV?.type === 'stone_bricks') {
        if (tileV.transparent) return; 
        vel.vy = 0;
      }
    }
  }
}
