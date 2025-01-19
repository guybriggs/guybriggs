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

      // Calculate proposed new position
      const proposedX = pos.x + vel.vx;
      const proposedY = pos.y + vel.vy;

      // Default behavior: cancel movement if hitting a wall (for NPCs)
      if (!isPlayer) {
        this.handleSimpleCollision(proposedX, proposedY, vel);
      } else {
        this.handlePlayerCollision(pos, vel);
      }
    }
  }

  handleSimpleCollision(proposedX, proposedY, vel) {
    const col = Math.floor(proposedX / tileSize);
    const row = Math.floor(proposedY / tileSize);

    // Check boundaries
    if (row < 0 || col < 0 || row >= mapRows || col >= mapCols) {
      vel.vx = 0;
      vel.vy = 0;
      return;
    }

    const tile = tileMap[row][col];
    if (tile.transparent) return; // No collision on "blueprint" tiles.
    if (tile.type === 'wall' || tile.type === 'stone_bricks') {
      vel.vx = 0;
      vel.vy = 0;
    }
  }

  handlePlayerCollision(pos, vel) {
    // Separate axis-by-axis checking for the player
    // Horizontal check
    const newX = pos.x + vel.vx;
    const colX = Math.floor(newX / tileSize);
    const rowCurrent = Math.floor(pos.y / tileSize);

    if (
      colX < 0 || rowCurrent < 0 || 
      colX >= mapCols || rowCurrent >= mapRows ||
      ['wall', 'stone_bricks'].includes(tileMap[rowCurrent][colX].type)
    ) {
        if (tileMap[rowCurrent][colX].transparent) return; // No collision on "blueprint" tiles.
        vel.vx = 0;
    }

    // Vertical check
    const newY = pos.y + vel.vy;
    const rowY = Math.floor(newY / tileSize);
    const colCurrent = Math.floor(pos.x / tileSize);

    if (
      rowY < 0 || colCurrent < 0 || 
      rowY >= mapRows || colCurrent >= mapCols ||
      ['wall', 'stone_bricks'].includes(tileMap[rowY][colCurrent].type)
    ) {
        if (tileMap[rowY][colCurrent].transparent) return; // No collision on "blueprint" tiles.
        vel.vy = 0;
    }
  }
}
