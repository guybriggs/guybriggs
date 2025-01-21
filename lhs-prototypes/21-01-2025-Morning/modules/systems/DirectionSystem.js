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
      if (waiting && waiting.until > 0) {
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

        // (A) FISH
        if (supply.good === Goods.FISH) {
          const hasFish = inventory.items.fish && inventory.items.fish > 0;

          if (!hasFish) {
            // Find the nearest icebox tile that has fish
            const boxTile = this.findTileWithFish(pos, 'icebox');
            if (!boxTile) {
              // no tile found => skip
              continue;
            }
            // safe move
            if (this.moveTowards(world, deltaTime, entity, boxTile.row, boxTile.col, 30)) {
              if (tileMap[boxTile.row][boxTile.col].inventory.items.fish > 0) {
                tileMap[boxTile.row][boxTile.col].inventory.items.fish--;
                inventory.items.fish = (inventory.items.fish || 0) + 1;
                if (waiting) waiting.until = 200;
              }
            }

          } else {
            // deliver to nearest cashregister
            const registerTile = findNearestTile(pos, 'cashregister');
            if (!registerTile) continue;
            if (this.moveTowards(world, deltaTime, entity, registerTile.row, registerTile.col, 30)) {
              // deposit fish
              const fishCount = inventory.items.fish;
              inventory.items.fish = 0;
              tileMap[registerTile.row][registerTile.col].inventory.addItem('fish', fishCount);
              if (waiting) waiting.until = 200;
            }
          }

        // (B) ASSISTANT_WORK
        } else if (supply.good === Goods.ASSISTANT_WORK) {
          const hasFish = inventory.items.fish && inventory.items.fish > 0;
          if (!hasFish) {
            // pick from fishingrod
            const rodTile = this.findTileWithFish(pos, 'fishingrod');
            if (!rodTile) continue;
            if (this.moveTowards(world, deltaTime, entity, rodTile.row, rodTile.col, 30)) {
              if (tileMap[rodTile.row][rodTile.col].inventory.items.fish > 0) {
                tileMap[rodTile.row][rodTile.col].inventory.items.fish--;
                inventory.items.fish = (inventory.items.fish || 0) + 1;
                if (waiting) waiting.until = 200;
              }
            }
          } else {
            // deposit in nearest icebox
            const iceboxTile = findNearestTile(pos, 'icebox');
            if (!iceboxTile) continue;
            if (this.moveTowards(world, deltaTime, entity, iceboxTile.row, iceboxTile.col, 30)) {
              let fishCount = inventory.items.fish;
              inventory.items.fish = 0;
              tileMap[iceboxTile.row][iceboxTile.col].inventory.addItem('fish', fishCount);
              if (waiting) waiting.until = 200;

              // Then try to get paid from nearest cash register
              const nearestCash = findNearestTile(pos, 'cashregister');
              if (nearestCash) {
                const row = nearestCash.row, col = nearestCash.col;
                // safely check row/col
                if (row != null && col != null) {
                  const employerId = tileMap[row][col].claimed;
                  const howMuchIWantToGetPaid = supply.reservationPrice || 8;
                  exchangeMoney(world, employerId, entity, howMuchIWantToGetPaid);
                }
              }
            }
          }

        // (C) FISH_WORK
        } else if (supply.good === Goods.FISH_WORK) {
          if (inventory.hasItem(Goods.FISH)) {
            // deposit in fishingrod
            const rodTile = findNearestTile(pos, 'fishingrod');
            if (!rodTile) continue;
            if (this.moveTowards(world, deltaTime, entity, rodTile.row, rodTile.col, 30)) {
              inventory.items.fish--;
              tileMap[rodTile.row][rodTile.col].inventory.addItem('fish', 1);
              if (waiting) waiting.until = 200;

              // Then try to get paid
              const nearestCash = findNearestTile(pos, 'cashregister');
              if (nearestCash) {
                const row = nearestCash.row, col = nearestCash.col;
                if (row != null && col != null) {
                  const employerId = tileMap[row][col].claimed;
                  const howMuchIWantToGetPaid = supply.reservationPrice || 10;
                  exchangeMoney(world, employerId, entity, howMuchIWantToGetPaid);
                }
              }
            }
          } else {
            // go to ocean for fish
            const oceanTile = findNearestTile(pos, 'ocean');
            if (!oceanTile) continue;
            if (this.moveTowards(world, deltaTime, entity, oceanTile.row, oceanTile.col, 30)) {
              inventory.addItem(Goods.FISH, 1);
              if (waiting) waiting.until = 500;
            }
          }
        }

      // ------------------------------
      // DEMAND LOGIC
      // ------------------------------
      } else if (demand) {

        if (inventory.hasItem(Goods.FISH)) {
          // if we have fish => go back to origin
          if (!origin) {
            console.log('tried to move back to origin, no origin comp');
            continue;
          }
          const originRow = Math.floor(origin.x / tileSize);
          const originCol = Math.floor(origin.y / tileSize);
          if (this.moveTowards(world, deltaTime, entity, originRow, originCol, 1)) {
            inventory.removeItem(Goods.FISH, 1);
            if (waiting) waiting.until = 2000;
          }

        } else {
          // no fish => try to buy from nearest cashregister
          const tile = findNearestTile(pos, 'cashregister');
          if (!tile) continue;
          if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
            const cashInv = tileMap[tile.row][tile.col].inventory;
            if (!cashInv) {
              console.log('no tile inventory at cashregister, skipping');
              continue;
            }
            // try to remove fish from cashreg
            cashInv.removeItem(Goods.FISH, 1);
            inventory.addItem(Goods.FISH, 1);

            const supplierId = tileMap[tile.row][tile.col].claimed;
            if (!supplierId || supplierId === -1) continue;
            const supplierSupply = world.getComponent(supplierId, 'Supply');
            if (!supplierSupply) continue;

            const cost = supplierSupply.reservationPrice || 8;
            exchangeMoney(world, entity, supplierId, cost);
          }
        }

      // ------------------------------
      // FALLBACK: Claim a tile if no supply or demand
      // ------------------------------
      } else {
        const nearRod = findNearestTile(pos, 'fishingrod');
        const nearFridge = findNearestTile(pos, 'fridge');
        const nearRegister = findNearestTile(pos, 'cashregister');
        const nearIcebox = findNearestTile(pos, 'icebox');
        const nearby = [nearRod, nearFridge, nearRegister, nearIcebox];

        let tile = this.closest(nearby, pos);
        if (!tile) continue;

        // If claimed => skip
        if (tileMap[tile.row][tile.col].claimed !== -1) {
          continue;
        }

        switch (tileMap[tile.row][tile.col].type) {
          case 'fishingrod': {
            // claim => fish_work supply
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
            // claim => demand fish
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
            // claim => supply fish
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
            // claim => supply assistant_work
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
   */
  applySeparation(world, entity, deltaTime) {
    const posA = world.getComponent(entity, 'Position');
    const renderA = world.getComponent(entity, 'Renderable');
    if (!posA || !renderA) return;

    const others = world.getEntitiesWith('Position', 'Renderable');
    let offsetX = 0, offsetY = 0;

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
        const overlap = desired - dist;
        const ratio = overlap / dist;
        offsetX += dx * ratio * 0.5;
        offsetY += dy * ratio * 0.5;
      }
    }

    posA.x += offsetX * 0.1;
    posA.y += offsetY * 0.1;
  }

  /**
   * moveTowards() => safely moves an entity to row,col
   */
  moveTowards(world, deltaTime, entity, row, col, threshold) {
    const pos = world.getComponent(entity, 'Position');
    const vel = world.getComponent(entity, 'Velocity');
    if (row == null || col == null) return false; // skip if invalid

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
   * findTileWithFish(pos, tileType) => returns the nearest tile of `tileType`
   * that has fish > 0, or null if none.
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
   * closest(array, pos): among array of {row,col} or {x,y}, find nearest to pos.
   */
  closest(array, pos) {
    let best = null;
    let minDist = Infinity;
    for (let t of array) {
      if (!t) continue;
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
