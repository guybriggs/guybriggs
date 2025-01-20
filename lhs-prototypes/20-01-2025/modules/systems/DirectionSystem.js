// modules/systems/DirectionSystem.js

import { Goods } from '../data/Goods.js';
import { findNearestTile } from '../utils/EnvironmentUtils.js';
import { InventoryComponent } from '../components/Inventory.js';
import { tileMap, tileSize } from '../tile/TileMap.js';
import { SupplyComponent } from '../components/Supply.js';
import { DemandComponent } from '../components/Demand.js';
import { RandomRange } from '../utils/RandomRange.js';
import { oneOffTalk } from '../systems/TalkInteractionSystem.js';

export class DirectionSystem {
  update(world, deltaTime) {
    const entities = world.getEntitiesWith('Position', 'Velocity', 'Waiting');

    for (const entity of entities) {
      const pos = world.getComponent(entity, 'Position');
      const vel = world.getComponent(entity, 'Velocity');
      const waiting = world.getComponent(entity, 'Waiting');

      const renderable = world.getComponent(entity, 'Renderable');
      const name = world.getComponent(entity, 'Name');
      const emotion = world.getComponent(entity, 'Emotion');
      const demand = world.getComponent(entity, 'Demand');
      const supply = world.getComponent(entity, 'Supply');
      const job = world.getComponent(entity, 'Job');
      const inventory = world.getComponent(entity, 'Inventory');
      const follower = world.getComponent(entity, 'Follower');
      const money = world.getComponent(entity, 'Money');

      // If still waiting, decrement and skip the rest of the logic
      if (waiting.until > 0) {
        waiting.until -= 1/10 * deltaTime;
        continue;
      }

      // Default velocity = 0 unless we have a reason to move
      vel.vx = 0;
      vel.vy = 0;

      // ----------------- SUPPLIER LOGIC -----------------
      if (supply) {
        // 1) FISH supplier
        if (supply.good === Goods.FISH) {
          // The idea:
          //   - If we don't have fish in our inventory, pick up fish from the nearest icebox that actually has fish
          //   - If we do have fish, deliver it to the nearest cashregister

          const hasFish = inventory.items.fish && inventory.items.fish > 0;

          if (!hasFish) {
            // Find the nearest icebox that has fish in its tile inventory
            let boxTile = this.findTileWithFish(pos, 'icebox');
            if (!boxTile) {
              // If no icebox has fish, we could do something else or just continue
              continue;
            }
            // Move towards the icebox tile
            if (this.moveTowards(world, deltaTime, entity, boxTile.row, boxTile.col, 1)) {
              // Once we arrive, pick up 1 fish (or more if desired)
              tileMap[boxTile.row][boxTile.col].inventory.items.fish--;
              inventory.items.fish = (inventory.items.fish || 0) + 1;
              waiting.until = 200; // wait briefly
            }

          } else {
            // We have fish in our inventory: deliver them to the nearest cashregister
            let registerTile = findNearestTile(pos, 'cashregister');
            if (!registerTile) continue;

            if (this.moveTowards(world, deltaTime, entity, registerTile.row, registerTile.col, 1)) {
              // Once we arrive, deposit all fish (or 1 fish — your choice)
              let fishCount = inventory.items.fish;
              inventory.items.fish = 0;  // empty personal inventory
              tileMap[registerTile.row][registerTile.col].inventory.addItem('fish', fishCount);

              waiting.until = 200; // small wait
            }
          }
        }
        // 2) ASSISTANT_WORK logic (*** FILLING IN ***)
        else if (supply && supply.good === Goods.ASSISTANT_WORK) {
          // The idea: 
          //   - If we DON'T have fish, find a fishingrod tile that HAS fish, pick it up
          //   - If we DO have fish, take it to the nearest icebox tile, deposit it
          //   - Repeat
          
          // Check if we have fish in our own inventory
          const hasFish = inventory.items.fish && inventory.items.fish > 0;

          if (!hasFish) {
            // Find the nearest fishingrod tile that has at least 1 fish
            let rodTile = this.findTileWithFish(pos, 'fishingrod');
            if (!rodTile) {
              // If no rod tile has fish, we do nothing or could wander.
              continue;
            }
            // Move to that fishingrod tile
            if (this.moveTowards(world, deltaTime, entity, rodTile.row, rodTile.col, 1)) {
              // Once we arrive, pick up 1 fish (or more if you prefer)
              tileMap[rodTile.row][rodTile.col].inventory.items.fish -= 1;
              inventory.items.fish = (inventory.items.fish || 0) + 1;
              // Wait a bit before next action
              waiting.until = 200;
            }
          } else {
            // We have fish in our inventory — deliver it to the nearest icebox
            let iceboxTile = findNearestTile(pos, 'icebox');
            if (!iceboxTile) continue;
            if (this.moveTowards(world, deltaTime, entity, iceboxTile.row, iceboxTile.col, 1)) {
              // Once we arrive, deposit all fish we have
              let fishCount = inventory.items.fish;
              inventory.items.fish = 0;
              tileMap[iceboxTile.row][iceboxTile.col].inventory.addItem('fish', fishCount);
              waiting.until = 200;
            }
          }
        }
        // 3) FISH_WORK logic
        else if (supply && supply.good === Goods.FISH_WORK) {
          // If the entity has fish in inventory, deliver it to the nearest fishingrod
          if (inventory.hasItem(Goods.FISH)) {
            let rodTile = findNearestTile(pos, 'fishingrod');
            if (!rodTile) continue;
            if (this.moveTowards(world, deltaTime, entity, rodTile.row, rodTile.col, 1)) {
              // Once we arrive, move fish from personal inventory to rod tile
              inventory.items.fish--;
              tileMap[rodTile.row][rodTile.col].inventory.addItem('fish', 1);
              // Wait briefly
              waiting.until = 200;
            }
          } 
          // Otherwise, no fish => go to ocean to "fish"
          else {
            let oceanTile = findNearestTile(pos, 'ocean');
            if (!oceanTile) continue;
            if (this.moveTowards(world, deltaTime, entity, oceanTile.row, oceanTile.col, 1)) {
              // "Catch" fish (add to inventory)
              inventory.addItem(Goods.FISH, 1);
              waiting.until = 500;
            }
          }
        }

      // ----------------- DEMAND LOGIC -----------------
      } else if (demand) {
        const suppliers = world.getEntitiesByComponents(['Supply', 'Inventory', 'Position', 'Velocity', 'Money']);
        let openSuppliers = [];
        suppliers.forEach(supp => {
          if (world.getComponent(supp, 'Supply').openForBusiness) {
            const suppPos = world.getComponent(supp, 'Position');
            openSuppliers.push({
              id: supp,
              x: suppPos.x,
              y: suppPos.y
            });
          }
        });
        const nearestSupplier = this.closest(openSuppliers, pos);
        if (!nearestSupplier) continue;

        let demanderId = entity;
        let supplierId = nearestSupplier.id;
        if (!demanderId || !supplierId) continue;

        const demandPos = world.getComponent(demanderId, 'Position');
        const supplyPos = world.getComponent(supplierId, 'Position');
        const demandInv = world.getComponent(demanderId, 'Inventory');
        const supplyInv = world.getComponent(supplierId, 'Inventory');
        const demandMoney = world.getComponent(demanderId, 'Money');
        const supplyMoney = world.getComponent(supplierId, 'Money');
        const demandersDemand = world.getComponent(demanderId, 'Demand');
        const suppliersSupply = world.getComponent(supplierId, 'Supply');
        const demandIsFollower = world.hasComponent(demanderId, 'Follower');
        const supplyIsFollower = world.hasComponent(supplierId, 'Follower');

        let price = suppliersSupply.reservationPrice;
        if (!price) continue;

        if (demandMoney.amount < price) {
          // Can't afford it
          if (this.moveTowards(
            world, deltaTime, entity,
            (supplyPos.y - tileSize/2) / tileSize,
            (supplyPos.x - tileSize/2) / tileSize,
            50
          )) {
            oneOffTalk(world, entity, "I can't afford that!");
            waiting.until = 5000;
          }
        } else {
          // Move in close enough to make the purchase
          if (this.moveTowards(
            world, deltaTime, entity,
            (supplyPos.y - tileSize/2) / tileSize,
            (supplyPos.x - tileSize/2) / tileSize,
            1
          )) {
            // If supplier has fish, buy one
            if (supplyInv.items.fish > 0) {
              supplyInv.items.fish -= 1;
              demandInv.items.fish = (demandInv.items.fish || 0) + 1;

              // Handle money exchange
              const moneyEntities = world.getEntitiesWith('Money');
              const mComp = world.getComponent(moneyEntities[0], 'Money');

              if (demandIsFollower) {
                // If the buyer is a follower, the global money decreases,
                // and the supplier's personal money goes up
                mComp.amount -= price;
                supplyMoney.amount += price;
              }
              if (supplyIsFollower) {
                // If the seller is a follower, the global money goes up,
                // and the buyer's personal money goes down
                mComp.amount += price;
                demandMoney.amount -= price;
              }

              // Move away quickly
              const awayDx = pos.x - supplyPos.x;
              const awayDy = pos.y - supplyPos.y;
              const awayDist = Math.hypot(awayDx, awayDy) || 1;
              const leaveSpeed = 2;
              vel.vx = (awayDx / awayDist) * leaveSpeed;
              vel.vy = (awayDy / awayDist) * leaveSpeed;
              waiting.until = 1000;

              console.log('Trade completed!');
            }
          }
        }

      // ----------------- FALLBACK -----------------
      } else {
        // No supply or demand => try to claim a tile
        let nearby = [
          findNearestTile(pos, 'fishingrod'),
          findNearestTile(pos, 'fridge'),
          findNearestTile(pos, 'cashregister'),
          findNearestTile(pos, 'icebox')
        ];

        let tile = this.closest(nearby, pos);
        if (!tile) continue;

        // If it's claimed, skip
        if (tileMap[tile.row][tile.col].claimed != -1) continue;

        switch (tileMap[tile.row][tile.col].type) {
          case 'fishingrod':
            if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
              const good = Goods.FISH_WORK;
              const reservationPrice = RandomRange(8, 15);
              const quantity = 999;
              world.addComponent(entity, 'Supply', SupplyComponent(good, reservationPrice, quantity));
              tileMap[tile.row][tile.col].claimed = entity;
            }
            break;
          case 'fridge':
            if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
              const good = Goods.FISH;
              const reservationPrice = RandomRange(8, 15);
              const quantity = 999;
              world.addComponent(entity, 'Demand', DemandComponent(good, reservationPrice, quantity));
              tileMap[tile.row][tile.col].claimed = entity;
            }
            break;
          case 'cashregister':
            if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
              const good = Goods.FISH;
              const reservationPrice = RandomRange(8, 15);
              const quantity = 999;
              world.addComponent(entity, 'Supply', SupplyComponent(good, reservationPrice, quantity));
              tileMap[tile.row][tile.col].claimed = entity;
            }
            break;
          case 'icebox':
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
  }

  /**
   * Return the closest object in an array to a given pos.
   * `array` can be tile objects or any object with row/col or x/y.
   */
  closest(array, pos) {
    let closestTile = null;
    let minDist = Infinity;
    
    for (let tile of array) {
      if (!tile) continue; 
      let a = tile.col ? tile.col : tile.x ? tile.x / tileSize : null;
      let b = tile.row ? tile.row : tile.y ? tile.y / tileSize : null;
      if (!a && a !== 0) continue;
      if (!b && b !== 0) continue;

      let tileX = a * tileSize + tileSize / 2;
      let tileY = b * tileSize + tileSize / 2;
      let dx = pos.x - tileX;
      let dy = pos.y - tileY;
      let distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDist) {
        minDist = distance;
        closestTile = tile;
      }
    }
    return closestTile;
  }

  /**
   * Move the entity toward a tile (given by row/col) and return `true`
   * if we’ve arrived (within `threshold` distance).
   */
  moveTowards(world, deltaTime, entity, row, col, threshold) {
    const pos = world.getComponent(entity, 'Position');
    const vel = world.getComponent(entity, 'Velocity');

    const ddx = col*tileSize - pos.x + tileSize/2;
    const ddy = row*tileSize - pos.y + tileSize/2;
    const d = Math.hypot(ddx, ddy);

    if (d > threshold) {
      const speed = 1/10; // base speed
      vel.vx = (ddx / d) * speed * deltaTime;
      vel.vy = (ddy / d) * speed * deltaTime;
      return false;
    } else {
      vel.vx = 0;
      vel.vy = 0;
      return true;
    }
  }

  /**
   * Helper function to find the nearest tile of `tileType` that currently has fish
   * in its inventory, if that’s what we need. This is just an example approach;
   * adapt as needed.
   */
  findTileWithFish(pos, tileType) {
    // 1. Create a list of all tiles of the specified type
    let candidates = [];
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        if (tileMap[r][c].type === tileType) {
          // Check if that tile has fish
          const tileInv = tileMap[r][c].inventory;
          if (tileInv && tileInv.items.fish > 0) {
            // Construct an object we can feed into `closest`
            candidates.push({ row: r, col: c });
          }
        }
      }
    }
    // 2. Use 'closest' to pick the nearest among them
    return this.closest(candidates, pos);
  }
}
