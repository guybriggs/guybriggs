// modules/systems/DirectionSystem.js

import { Goods } from '../data/Goods.js';
import { findNearestTile } from '../utils/EnvironmentUtils.js';
import { tileMap, tileSize } from '../tile/TileMap.js';
import { SupplyComponent } from '../components/Supply.js';
import { DemandComponent } from '../components/Demand.js';
import { RandomRange } from '../utils/RandomRange.js';
import { oneOffTalk } from '../systems/TalkInteractionSystem.js';
import { exchangeMoney } from '../utils/ExchangeMoney.js';

export class DirectionSystem {
  update(world, deltaTime) {
    // Get all agents that have Position, Velocity, and Waiting
    const entities = world.getEntitiesWith('Position', 'Velocity', 'Waiting');

    for (const entity of entities) {
      const pos = world.getComponent(entity, 'Position');
      const vel = world.getComponent(entity, 'Velocity');
      const waiting = world.getComponent(entity, 'Waiting');

      // We also grab other components we might use
      const renderable = world.getComponent(entity, 'Renderable');
      const name = world.getComponent(entity, 'Name');
      const emotion = world.getComponent(entity, 'Emotion');
      const demand = world.getComponent(entity, 'Demand');
      const supply = world.getComponent(entity, 'Supply');
      const job = world.getComponent(entity, 'Job');
      const inventory = world.getComponent(entity, 'Inventory');
      const follower = world.getComponent(entity, 'Follower');
      const money = world.getComponent(entity, 'Money');
      const origin = world.getComponent(entity, 'Origin');

      // If waiting is still active, reduce its timer and skip movement logic
      if (waiting.until > 0) {
        waiting.until -= (1 / 10) * deltaTime;
        continue;
      }

      // Reset velocity to zero unless we have a reason to move
      vel.vx = 0;
      vel.vy = 0;

      // ------------------------------
      // SUPPLIER LOGIC
      // ------------------------------
      if (supply) {
        // 1) If supply.good === FISH
        if (supply.good === Goods.FISH) {
          // If the agent doesn't have fish => pick up from nearest icebox
          // If the agent does have fish => deliver to nearest cashregister
          const hasFish = inventory.items.fish && inventory.items.fish > 0;

          if (!hasFish) {
            // Find the nearest icebox tile that has fish
            let boxTile = this.findTileWithFish(pos, 'icebox');
            if (!boxTile) {
              // No icebox has fish; do nothing
              continue;
            }
            // Move towards that tile with threshold=30 => pick up from a short distance
            if (this.moveTowards(world, deltaTime, entity, boxTile.row, boxTile.col, 30)) {
              // If the tile actually has fish, pick up 1
              if (tileMap[boxTile.row][boxTile.col].inventory.items.fish > 0) {
                tileMap[boxTile.row][boxTile.col].inventory.items.fish--;
                inventory.items.fish = (inventory.items.fish || 0) + 1;
                waiting.until = 200; // short wait
              }
            }
          } else {
            // Has fish => deliver to nearest cashregister
            let registerTile = findNearestTile(pos, 'cashregister');
            if (!registerTile) continue;

            if (this.moveTowards(world, deltaTime, entity, registerTile.row, registerTile.col, 30)) {
              // Drop all fish
              let fishCount = inventory.items.fish;
              inventory.items.fish = 0;
              tileMap[registerTile.row][registerTile.col].inventory.addItem('fish', fishCount);
              waiting.until = 200;
            }
          }
        }
        // 2) If supply.good === ASSISTANT_WORK
        else if (supply.good === Goods.ASSISTANT_WORK) {
          // If no fish in inventory => go pick from fishingrod
          // If has fish => deposit in nearest icebox
          const hasFish = inventory.items.fish && inventory.items.fish > 0;
          if (!hasFish) {
            let rodTile = this.findTileWithFish(pos, 'fishingrod');
            if (!rodTile) continue;
            if (this.moveTowards(world, deltaTime, entity, rodTile.row, rodTile.col, 30)) {
              if (tileMap[rodTile.row][rodTile.col].inventory.items.fish > 0) {
                tileMap[rodTile.row][rodTile.col].inventory.items.fish--;
                inventory.items.fish = (inventory.items.fish || 0) + 1;
                waiting.until = 200;
              }
            }
          } else {
            let iceboxTile = findNearestTile(pos, 'icebox');
            if (!iceboxTile) continue;
            if (this.moveTowards(world, deltaTime, entity, iceboxTile.row, iceboxTile.col, 30)) {
              let fishCount = inventory.items.fish;
              inventory.items.fish = 0;
              tileMap[iceboxTile.row][iceboxTile.col].inventory.addItem('fish', fishCount);
              waiting.until = 200;

              const nearestCash = findNearestTile(pos, 'cashregister');
              const employerId = tileMap[nearestCash.row][nearestCash.col].claimed;
              const howMuchIWantToGetPaid = supply.reservationPrice;

              exchangeMoney(world, employerId, entity, howMuchIWantToGetPaid);

            }
          }
        }
        // 3) If supply.good === FISH_WORK
        else if (supply.good === Goods.FISH_WORK) {
          // If we have fish => deposit in fishingrod tile
          // Otherwise => go to ocean to "catch" fish
          if (inventory.hasItem(Goods.FISH)) {
            let rodTile = findNearestTile(pos, 'fishingrod');
            if (!rodTile) continue;
            if (this.moveTowards(world, deltaTime, entity, rodTile.row, rodTile.col, 30)) {
              inventory.items.fish--;
              tileMap[rodTile.row][rodTile.col].inventory.addItem('fish', 1);
              waiting.until = 200;

              const nearestCash = findNearestTile(pos, 'cashregister');
              const employerId = tileMap[nearestCash.row][nearestCash.col].claimed;
              const howMuchIWantToGetPaid = supply.reservationPrice;

              exchangeMoney(world, employerId, entity, howMuchIWantToGetPaid);
            }
          } else {
            let oceanTile = findNearestTile(pos, 'ocean');
            if (!oceanTile) continue;
            if (this.moveTowards(world, deltaTime, entity, oceanTile.row, oceanTile.col, 30)) {
              // "Catch" fish
              inventory.addItem(Goods.FISH, 1);
              waiting.until = 500;
            }
          }
        }

      // ------------------------------
      // DEMAND LOGIC
      // ------------------------------
      } else if (demand) {


        if (inventory.hasItem(Goods.FISH)) {

          if (!origin) {
            console.log('tried to move back to origin, no o. comp');
            continue;
          }

          if (this.moveTowards(world, deltaTime, entity, Math.floor(origin.x / tileSize), Math.floor(origin.y / tileSize), 1)) {

            inventory.removeItem(Goods.FISH, 1);
            waiting.until = 2000;

          }

        } else {

          let tile = findNearestTile(pos, 'cashregister');
          if (!tile) continue;
  
          if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
            const cashInv = tileMap[tile.row][tile.col].inventory;
            if (!cashInv) {
              console.log('tried to access tile inventory, cant');
              continue;
            }

            cashInv.removeItem(Goods.FISH, 1);
            inventory.addItem(Goods.FISH, 1);
  
            const supplierId = tileMap[tile.row][tile.col].claimed;
            if (!supplierId || !supplierId == -1) continue;
            const supplierSupply = world.getComponent(supplierId, 'Supply');
            if (!supplierSupply) continue;

            const cost = supplierSupply.reservationPrice;

            exchangeMoney(world, entity, supplierId, cost);
          }

        }


      // ------------------------------
      // FALLBACK: Claim a tile if no supply or demand
      // ------------------------------
      } else {
        let nearby = [
          findNearestTile(pos, 'fishingrod'),
          findNearestTile(pos, 'fridge'),
          findNearestTile(pos, 'cashregister'),
          findNearestTile(pos, 'icebox')
        ];

        let tile = this.closest(nearby, pos);
        if (!tile) continue;

        // If claimed => skip
        if (tileMap[tile.row][tile.col].claimed !== -1) {
          continue;
        }

        switch (tileMap[tile.row][tile.col].type) {
          case 'fishingrod': {
            if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
              const good = Goods.FISH_WORK;
              const reservationPrice = RandomRange(8, 15);
              const quantity = 999;
              world.addComponent(entity, 'Supply', SupplyComponent(good, reservationPrice, quantity));
              tileMap[tile.row][tile.col].claimed = entity;
            }
            break;
          }
          case 'fridge': {
            if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
              const good = Goods.FISH;
              const reservationPrice = RandomRange(8, 15);
              const quantity = 999;
              world.addComponent(entity, 'Demand', DemandComponent(good, reservationPrice, quantity));
              tileMap[tile.row][tile.col].claimed = entity;
            }
            break;
          }
          case 'cashregister': {
            if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
              const good = Goods.FISH;
              const reservationPrice = RandomRange(8, 15);
              const quantity = 999;
              world.addComponent(entity, 'Supply', SupplyComponent(good, reservationPrice, quantity));
              tileMap[tile.row][tile.col].claimed = entity;
            }
            break;
          }
          case 'icebox': {
            if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
              const good = Goods.ASSISTANT_WORK;
              const reservationPrice = RandomRange(8, 15);
              const quantity = 999;
              world.addComponent(entity, 'Supply', SupplyComponent(good, reservationPrice, quantity));
              tileMap[tile.row][tile.col].claimed = entity;
            }
            break;
          }
        }
      }

      // ------------------------------
      // SEPARATION STEP: avoid overlap
      // ------------------------------
      this.applySeparation(world, entity, deltaTime);
    }
  }

  /**
   * A small separation step that prevents agents from overlapping each other.
   * For each agent, compare to all other agents with a Renderable & Position,
   * and if too close, push it away slightly.
   */
  applySeparation(world, entity, deltaTime) {
    const posA = world.getComponent(entity, 'Position');
    const renderA = world.getComponent(entity, 'Renderable');
    if (!posA || !renderA) return;

    // We'll define a minimum spacing as the sum of their radii plus a small buffer
    const others = world.getEntitiesWith('Position', 'Renderable');
    let offsetX = 0;
    let offsetY = 0;

    for (let otherId of others) {
      if (otherId === entity) continue;
      const posB = world.getComponent(otherId, 'Position');
      const renderB = world.getComponent(otherId, 'Renderable');
      if (!posB || !renderB) continue;

      const dx = posA.x - posB.x;
      const dy = posA.y - posB.y;
      const dist = Math.hypot(dx, dy);
      const desired = renderA.radius + renderB.radius + 2;

      if (dist < desired && dist > 0.0001) {
        // They overlap => push A away from B
        const overlap = desired - dist;
        const ratio = overlap / dist;
        offsetX += dx * ratio * 0.5; 
        offsetY += dy * ratio * 0.5;
      }
    }

    // Apply offset in a controlled manner so they don't jostle too harshly
    posA.x += offsetX * 0.1;
    posA.y += offsetY * 0.1;
  }

  /**
   * Move the entity toward the tile (given by row/col), stopping once
   * within `threshold` distance. Return true if within that distance.
   */
  moveTowards(world, deltaTime, entity, row, col, threshold) {
    const pos = world.getComponent(entity, 'Position');
    const vel = world.getComponent(entity, 'Velocity');
    const targetX = col * tileSize + tileSize / 2;
    const targetY = row * tileSize + tileSize / 2;
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const d = Math.hypot(dx, dy);

    if (d > threshold) {
      const speed = 1 / 10; // base speed
      vel.vx = (dx / d) * speed * deltaTime;
      vel.vy = (dy / d) * speed * deltaTime;
      return false;
    } else {
      vel.vx = 0;
      vel.vy = 0;
      return true;
    }
  }

  /**
   * Find the tile of `tileType` that has fish, nearest to pos.
   */
  findTileWithFish(pos, tileType) {
    let candidates = [];
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        if (tileMap[r][c].type === tileType) {
          const inv = tileMap[r][c].inventory;
          if (inv && inv.items.fish > 0) {
            candidates.push({ row: r, col: c });
          }
        }
      }
    }
    return this.closest(candidates, pos);
  }

  /**
   * Return the closest tile (or object) from the array to pos.
   * `array` items can have (row, col) or (x, y).
   */
  closest(array, pos) {
    let best = null;
    let minDist = Infinity;

    for (let t of array) {
      if (!t) continue;
      // If t has row/col, compute tile center
      // or if it has x,y => use those
      let tileX, tileY;
      if (t.col != null && t.row != null) {
        tileX = t.col * tileSize + tileSize / 2;
        tileY = t.row * tileSize + tileSize / 2;
      } else if (t.x != null && t.y != null) {
        tileX = t.x;
        tileY = t.y;
      } else {
        continue;
      }

      const dx = pos.x - tileX;
      const dy = pos.y - tileY;
      const dist = Math.hypot(dx, dy);
      if (dist < minDist) {
        minDist = dist;
        best = t;
      }
    }
    return best;
  }
}
