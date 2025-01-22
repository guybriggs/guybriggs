// modules/systems/DirectionSystem.js

import { Goods } from '../data/Goods.js';
import { findNearestTile } from '../utils/EnvironmentUtils.js';
import { tileMap, tileSize } from '../tile/TileMap.js';
import { SupplyComponent } from '../components/Supply.js';
import { DemandComponent } from '../components/Demand.js';
import { RandomRange } from '../utils/RandomRange.js';
import { oneOffTalk } from '../systems/TalkInteractionSystem.js';
import { exchangeMoney } from '../utils/ExchangeMoney.js';

/**
 * For convenience: random "rotten fish" lines for when a consumer buys wasted fish.
 */
const ROTTEN_DIALOGS = [
  "Yuck!!",
  "Ew!!!",
  "It's stinkier than I remember.",
  "*bleurg*",
  "Disgusting quality.",
  "Yuck, not coming back again.",
  "Shrek fish?"
];

/**
 * Helper to increment price by +5, +10, or +50.
 */
function getNextPriceIncrement(countSoFar) {
  if (countSoFar <= 4) return 5;
  else if (countSoFar <= 7) return 10;
  else return 50;
}

export class DirectionSystem {
  update(world, deltaTime) {
    const entities = world.getEntitiesWith('Position', 'Velocity', 'Waiting');

    for (const entity of entities) {
      const pos = world.getComponent(entity, 'Position');
      const vel = world.getComponent(entity, 'Velocity');
      const waiting = world.getComponent(entity, 'Waiting');

      // Skip if waiting
      if (waiting && waiting.until > 0) {
        waiting.until -= (1 / 10) * deltaTime;
        continue;
      }

      // Default velocity = 0
      vel.vx = 0;
      vel.vy = 0;

      // Check if Supply or Demand
      const supply = world.getComponent(entity, 'Supply');
      const demand = world.getComponent(entity, 'Demand');

      if (supply) {
        if (supply.good === Goods.FISH) {
          this.handleFishSeller(world, entity, deltaTime);
        } else if (supply.good === Goods.ASSISTANT_WORK) {
          this.handleAssistant(world, entity, deltaTime);
        } else if (supply.good === Goods.FISH_WORK) {
          this.handleFisher(world, entity, deltaTime);
        }
      } else if (demand) {
        this.handleDemand(world, entity, deltaTime);
      } else {
        this.handleFallback(world, entity, deltaTime);
      }

      // Avoid overlapping
      this.applySeparation(world, entity, deltaTime);
    }
  }

  // ----------------------------------------------------------------------
  // (A) Fish Seller => supply.good === FISH
  // ----------------------------------------------------------------------
  handleFishSeller(world, entity, deltaTime) {
    const pos = world.getComponent(entity, 'Position');
    const waiting = world.getComponent(entity, 'Waiting');
    const inventory = world.getComponent(entity, 'Inventory');

    const freshCount = inventory.items.fish || 0;
    const wastedCount = inventory.items.wasted_fish || 0;
    const hasFish = (freshCount + wastedCount) > 0;

    // Check if there's at least one icebox on the entire map.
    const anyIcebox = this.tileExists('icebox');

    if (!anyIcebox) {
      // If no icebox => fishrod -> deposit in red_carpet
      if (!hasFish) {
        // pick up from fishingrod
        const rodTile = this.findTileWithAnyFish(pos, 'fishingrod');
        if (!rodTile) return;
        if (this.moveTowards(world, deltaTime, entity, rodTile.row, rodTile.col, 30)) {
          const tileInv = tileMap[rodTile.row][rodTile.col].inventory;
          // pick up fresh if possible, else wasted
          if ((tileInv.items.fish || 0) > 0) {
            tileInv.items.fish--;
            inventory.items.fish = (inventory.items.fish || 0) + 1;
          } else if ((tileInv.items.wasted_fish || 0) > 0) {
            tileInv.items.wasted_fish--;
            inventory.items.wasted_fish = (inventory.items.wasted_fish || 0) + 1;
          }
          if (waiting) waiting.until = 200;
        }
      } else {
        // deposit in red_carpet
        const registerTile = this.findTileOfTypeFewestTotalFish('red_carpet');
        if (!registerTile) return;
        if (this.moveTowards(world, deltaTime, entity, registerTile.row, registerTile.col, 30)) {
          const tileInv = tileMap[registerTile.row][registerTile.col].inventory;
          const depositFresh = inventory.items.fish || 0;
          const depositWasted = inventory.items.wasted_fish || 0;
          inventory.items.fish = 0;
          inventory.items.wasted_fish = 0;

          if (depositFresh > 0) {
            tileInv.addItem('fish', depositFresh);
          }
          if (depositWasted > 0) {
            tileInv.addItem('wasted_fish', depositWasted);
          }
          if (waiting) waiting.until = 200;
        }
      }
    } else {
      // If there's an icebox => fishrod -> icebox -> register
      if (!hasFish) {
        const boxTile = this.findTileWithAnyFish(pos, 'icebox');
        if (!boxTile) return;
        if (this.moveTowards(world, deltaTime, entity, boxTile.row, boxTile.col, 30)) {
          const tileInv = tileMap[boxTile.row][boxTile.col].inventory;
          if ((tileInv.items.fish || 0) > 0) {
            tileInv.items.fish--;
            inventory.items.fish = (inventory.items.fish || 0) + 1;
          } else if ((tileInv.items.wasted_fish || 0) > 0) {
            tileInv.items.wasted_fish--;
            inventory.items.wasted_fish = (inventory.items.wasted_fish || 0) + 1;
          }
          if (waiting) waiting.until = 200;
        }
      } else {
        const registerTile = this.findTileOfTypeFewestTotalFish('red_carpet');
        if (!registerTile) return;
        if (this.moveTowards(world, deltaTime, entity, registerTile.row, registerTile.col, 30)) {
          const tileInv = tileMap[registerTile.row][registerTile.col].inventory;
          const depositFresh = inventory.items.fish || 0;
          const depositWasted = inventory.items.wasted_fish || 0;
          inventory.items.fish = 0;
          inventory.items.wasted_fish = 0;

          if (depositFresh > 0) {
            tileInv.addItem('fish', depositFresh);
          }
          if (depositWasted > 0) {
            tileInv.addItem('wasted_fish', depositWasted);
          }
          if (waiting) waiting.until = 200;
        }
      }
    }
  }

  // ----------------------------------------------------------------------
  // (B) Assistant => unchanged
  // ----------------------------------------------------------------------
  handleAssistant(world, entity, deltaTime) {
    const pos = world.getComponent(entity, 'Position');
    const waiting = world.getComponent(entity, 'Waiting');
    const supply = world.getComponent(entity, 'Supply');
    const inventory = world.getComponent(entity, 'Inventory');

    const freshCount = inventory.items.fish || 0;
    const wastedCount = inventory.items.wasted_fish || 0;
    const hasSomething = (freshCount + wastedCount) > 0;

    if (!hasSomething) {
      const rodTile = this.findTileWithAnyFish(pos, 'fishingrod');
      if (!rodTile) return;
      if (this.moveTowards(world, deltaTime, entity, rodTile.row, rodTile.col, 30)) {
        const tileInv = tileMap[rodTile.row][rodTile.col].inventory;
        if ((tileInv.items.fish || 0) > 0) {
          tileInv.items.fish--;
          inventory.items.fish = freshCount + 1;
        } else if ((tileInv.items.wasted_fish || 0) > 0) {
          tileInv.items.wasted_fish--;
          inventory.items.wasted_fish = wastedCount + 1;
        }
        if (waiting) waiting.until = 200;
      }
    } else {
      const iceboxTile = this.findTileOfTypeFewestTotalFish('icebox');
      if (!iceboxTile) return;
      if (this.moveTowards(world, deltaTime, entity, iceboxTile.row, iceboxTile.col, 30)) {
        const tileInv = tileMap[iceboxTile.row][iceboxTile.col].inventory;
        const depositFresh = inventory.items.fish || 0;
        const depositWasted = inventory.items.wasted_fish || 0;

        inventory.items.fish = 0;
        inventory.items.wasted_fish = 0;
        if (depositFresh > 0) tileInv.addItem('fish', depositFresh);
        if (depositWasted > 0) tileInv.addItem('wasted_fish', depositWasted);
        if (waiting) waiting.until = 200;

        // get paid
        const nearestCash = findNearestTile(pos, 'red_carpet');
        if (nearestCash) {
          const row = nearestCash.row;
          const col = nearestCash.col;
          if (row != null && col != null) {
            const employerId = tileMap[row][col].claimed;
            const howMuchIWantToGetPaid = supply.reservationPrice || 10;
            exchangeMoney(world, employerId, entity, howMuchIWantToGetPaid);
          }
        }
      }
    }
  }

  // ----------------------------------------------------------------------
  // (C) Fisher => unchanged
  // ----------------------------------------------------------------------
  handleFisher(world, entity, deltaTime) {
    const pos = world.getComponent(entity, 'Position');
    const waiting = world.getComponent(entity, 'Waiting');
    const supply = world.getComponent(entity, 'Supply');
    const inventory = world.getComponent(entity, 'Inventory');

    if (inventory.hasItem(Goods.FISH)) {
      const rodTile = this.findTileOfTypeFewestTotalFish('fishingrod');
      if (!rodTile) return;
      if (this.moveTowards(world, deltaTime, entity, rodTile.row, rodTile.col, 30)) {
        inventory.items.fish--;
        tileMap[rodTile.row][rodTile.col].inventory.addItem('fish', 1);
        if (waiting) waiting.until = 200;

        // get paid
        const nearestCash = findNearestTile(pos, 'red_carpet');
        if (nearestCash) {
          const row = nearestCash.row;
          const col = nearestCash.col;
          if (row != null && col != null) {
            const employerId = tileMap[row][col].claimed;
            const howMuchIWantToGetPaid = supply.reservationPrice || 10;
            exchangeMoney(world, employerId, entity, howMuchIWantToGetPaid);
          }
        }
      }
    } else {
      const oceanTile = findNearestTile(pos, 'ocean');
      if (!oceanTile) return;
      if (this.moveTowards(world, deltaTime, entity, oceanTile.row, oceanTile.col, 30)) {
        inventory.addItem(Goods.FISH, 1);
        if (waiting) waiting.until = 500;
      }
    }
  }

  // ----------------------------------------------------------------------
  // (D) handleDemand => updated to claim a register or go home if none
  // ----------------------------------------------------------------------
  handleDemand(world, entity, deltaTime) {
    const pos = world.getComponent(entity, 'Position');
    const waiting = world.getComponent(entity, 'Waiting');
    const demand = world.getComponent(entity, 'Demand');
    const inventory = world.getComponent(entity, 'Inventory');
    const origin = world.getComponent(entity, 'Origin');

    const freshInInv = inventory.items.fish || 0;
    const wastedInInv = inventory.items.wasted_fish || 0;

    // 2) If consumer does NOT have a locked register => try to find/unlock one
    if (!demand.lockedRegister) {
      const registerTile = this.findRegisterWithMostFish(); 
      if (!registerTile) {
        // No free register => go home
        if (origin) {
          const originRow = Math.floor(origin.x / tileSize);
          const originCol = Math.floor(origin.y / tileSize);
          this.moveTowards(world, deltaTime, entity, originRow, originCol, 1);
        }
        return;
      } else {
        // Claim this register => lock them both ways
        demand.lockedRegister = { row: registerTile.row, col: registerTile.col };
        tileMap[registerTile.row][registerTile.col].lockedDemand = entity;
        // Fall through => go to your newly locked register
      }
    }

    // If we do have a lockedRegister => go there
    if (demand.lockedRegister) {
      const { row, col } = demand.lockedRegister;
      if (this.moveTowards(world, deltaTime, entity, row, col, 1)) {
        const cashInv = tileMap[row][col].inventory;
        if (!cashInv) return;

        // NEW: 30-second purchase cooldown
        const now = performance.now(); // or Date.now()
        if (demand.lastBuyTime == null) {
          // allow immediate first purchase
          demand.lastBuyTime = now - 30000;
        }
        const timeSinceLastBuy = now - demand.lastBuyTime;
        if (timeSinceLastBuy < 30000) {
          // Haven't waited 30s yet => skip buying
          return;
        }

        // Otherwise => we can buy now
        demand.lastBuyTime = now; // reset timer

        const freshInRegister = cashInv.items.fish || 0;
        const wastedInRegister = cashInv.items.wasted_fish || 0;

        // If fresh => buy fresh => +2 rep
        if (freshInRegister > 0) {
          cashInv.removeItem('fish', 1);
          inventory.addItem('fish', 1);
          world.reputation = (world.reputation || 0) + 2;
        }
        // If rotten => buy => -10 rep
        else if (wastedInRegister > 0) {
          cashInv.removeItem('wasted_fish', 1);
          inventory.addItem('wasted_fish', 1);
          world.reputation = (world.reputation || 0) - 10;
          const randomLine = ROTTEN_DIALOGS[Math.floor(Math.random() * ROTTEN_DIALOGS.length)];
          oneOffTalk(world, entity, randomLine);
        } else {
          // No fish => do nothing or negative fish
          cashInv.removeItem('fish', 1);
          inventory.addItem('fish', 1);
        }

        // Pay the supplier
        const supplierId = tileMap[row][col].claimed;
        if (supplierId && supplierId !== -1) {
          const cost = demand.reservationPrice || 10;
          exchangeMoney(world, entity, supplierId, cost);
        }
      }
    }
  }

  // ----------------------------------------------------------------------
  // findRegisterWithMostFish => sums fresh + wasted
  // Now skips registers if lockedDemand != null
  // ----------------------------------------------------------------------
  findRegisterWithMostFish() {
    let bestTile = null;
    let maxCount = -Infinity;

    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        const tile = tileMap[r][c];
        if (tile.type === 'red_carpet' && tile.inventory) {
          // skip if locked
          if (tile.lockedDemand != null) {
            continue;
          }

          const fCount = tile.inventory.items.fish || 0;
          const wCount = tile.inventory.items.wasted_fish || 0;
          const total = fCount + wCount;
          if (total > maxCount) {
            maxCount = total;
            bestTile = { row: r, col: c };
          }
        }
      }
    }
    if (bestTile) return bestTile;
    return null;
  }

  // ----------------------------------------------------------------------
  // handleFallback => claim a tile if no supply/demand
  // (Note: we removed the 'red_carpet' case from here)
  // ----------------------------------------------------------------------
  handleFallback(world, entity, deltaTime) {
    const pos = world.getComponent(entity, 'Position');

    // We consider fishingrod, fridge, icebox => normal
    // 'locker' => spawn fish sellers
    // (red_carpet is omitted so blank agents won't claim it)
    const nearRod = findNearestTile(pos, 'fishingrod');
    const nearFridge = findNearestTile(pos, 'fridge');
    const nearRegister = findNearestTile(pos, 'red_carpet');
    const nearIcebox = findNearestTile(pos, 'icebox');
    const nearLocker = findNearestTile(pos, 'locker');

    const nearby = [ nearRod, nearFridge, nearRegister, nearIcebox, nearLocker ];

    let tile = this.closest(nearby, pos);
    if (!tile) return;
    if (tileMap[tile.row][tile.col].claimed !== -1) return;

    const tileType = tileMap[tile.row][tile.col].type;
    switch (tileType) {
      case 'fishingrod': {
        // fisher
        if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
          const good = Goods.FISH_WORK;
          const quantity = 999;
          if (!world.numFishingRodsClaimed) {
            world.numFishingRodsClaimed = 0;
          }
          const rodIndex = world.numFishingRodsClaimed + 1;
          if (world.lastFisherPrice == null) {
            world.lastFisherPrice = 8;
            world.numFishingRodsClaimed = 1;
            tileMap[tile.row][tile.col].claimed = entity;
            world.addComponent(
              entity,
              'Supply',
              SupplyComponent(good, world.lastFisherPrice, quantity)
            );
            return;
          }
          const increment = getNextPriceIncrement(rodIndex);
          const newPrice = world.lastFisherPrice + increment;
          world.lastFisherPrice = newPrice;
          world.numFishingRodsClaimed++;
          world.addComponent(entity, 'Supply', SupplyComponent(good, newPrice, quantity));
          tileMap[tile.row][tile.col].claimed = entity;
        }
        break;
      }

      case 'icebox': {
        // Assistant
        if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
          const good = Goods.ASSISTANT_WORK;
          const quantity = 999;
          if (!world.numIceboxesClaimed) {
            world.numIceboxesClaimed = 0;
          }
          const boxIndex = world.numIceboxesClaimed + 1;
          if (world.lastAssistantPrice == null) {
            world.lastAssistantPrice = 8;
            world.numIceboxesClaimed = 1;
            tileMap[tile.row][tile.col].claimed = entity;
            world.addComponent(
              entity,
              'Supply',
              SupplyComponent(good, world.lastAssistantPrice, quantity)
            );
            return;
          }
          const increment = getNextPriceIncrement(boxIndex);
          const newPrice = world.lastAssistantPrice + increment;
          world.lastAssistantPrice = newPrice;
          world.numIceboxesClaimed++;
          world.addComponent(entity, 'Supply', SupplyComponent(good, newPrice, quantity));
          tileMap[tile.row][tile.col].claimed = entity;
        }
        break;
      }

      case 'locker': {
        // spawn fish sellers
        if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
          const good = Goods.FISH;
          const quantity = 999;

          if (!world.numLockersClaimed) {
            world.numLockersClaimed = 0;
          }
          const lockerIndex = world.numLockersClaimed + 1;

          if (world.lastFishSellerPrice == null) {
            world.lastFishSellerPrice = 8;
            world.numLockersClaimed = 1;
            tileMap[tile.row][tile.col].claimed = entity;
            world.addComponent(
              entity,
              'Supply',
              SupplyComponent(good, world.lastFishSellerPrice, quantity)
            );
            return;
          }

          const increment = getNextPriceIncrement(lockerIndex);
          const newPrice = world.lastFishSellerPrice + increment;
          world.lastFishSellerPrice = newPrice;
          world.numLockersClaimed++;

          world.addComponent(
            entity,
            'Supply',
            SupplyComponent(good, newPrice, quantity)
          );
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

      // Notice we do NOT handle 'red_carpet' here => blank agents won't claim it
    }
  }

  // ------------------------------------------------------------------------
  // tileExists => checks if the map has a tile of that type anywhere
  // ------------------------------------------------------------------------
  tileExists(tileType) {
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        if (tileMap[r][c].type === tileType) {
          return true;
        }
      }
    }
    return false;
  }

  // ----------------------------------------------------------------------
  // findTileOfTypeFewestTotalFish => unchanged
  // ----------------------------------------------------------------------
  findTileOfTypeFewestTotalFish(tileType) {
    let best = null;
    let minCount = Infinity;

    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        const tile = tileMap[r][c];
        if (tile.type === tileType && tile.inventory) {
          const inv = tile.inventory.items;
          const totalFishHere = (inv.fish || 0) + (inv.wasted_fish || 0);
          if (totalFishHere < minCount) {
            minCount = totalFishHere;
            best = { row: r, col: c };
          }
        }
      }
    }
    return best;
  }

  // ----------------------------------------------------------------------
  // findTileWithAnyFish => unchanged
  // ----------------------------------------------------------------------
  findTileWithAnyFish(pos, tileType) {
    const candidates = [];
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        if (tileMap[r][c].type === tileType) {
          const inv = tileMap[r][c].inventory;
          if (!inv) continue;
          const fresh = inv.items.fish || 0;
          const wasted = inv.items.wasted_fish || 0;
          if (fresh > 0 || wasted > 0) {
            candidates.push({ row: r, col: c });
          }
        }
      }
    }
    return this.closest(candidates, pos);
  }

  // Movement + separation
  moveTowards(world, deltaTime, entity, row, col, threshold) {
    const pos = world.getComponent(entity, 'Position');
    const vel = world.getComponent(entity, 'Velocity');
    if (row == null || col == null) return false;

    const targetX = col * tileSize + tileSize / 2;
    const targetY = row * tileSize + tileSize / 2;
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const d = Math.hypot(dx, dy);

    if (d > threshold) {
      const speed = 1 / 10;
      vel.vx = (dx / d) * speed * deltaTime;
      vel.vy = (dy / d) * speed * deltaTime;
      return false;
    } else {
      vel.vx = 0;
      vel.vy = 0;
      return true;
    }
  }

  applySeparation(world, entity, deltaTime) {
    const posA = world.getComponent(entity, 'Position');
    const renderA = world.getComponent(entity, 'Renderable');
    if (!posA || !renderA) return;

    const others = world.getEntitiesWith('Position', 'Renderable');
    let offsetX = 0, offsetY = 0;

    for (const otherId of others) {
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

  // Helper => findTileWithFish
  findTileWithFish(pos, tileType) {
    const candidates = [];
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

  // closest => standard helper
  closest(array, pos) {
    let best = null;
    let minDist = Infinity;
    for (const t of array) {
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
