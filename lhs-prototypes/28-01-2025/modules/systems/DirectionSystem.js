// modules/systems/DirectionSystem.js

import { Goods } from '../data/Goods.js';
import { findNearestTile } from '../utils/EnvironmentUtils.js';
import { tileMap, tileSize } from '../tile/TileMap.js';
import { SupplyComponent } from '../components/Supply.js';
import { DemandComponent } from '../components/Demand.js';
import { RandomRange } from '../utils/RandomRange.js';
import { oneOffTalk } from '../systems/TalkInteractionSystem.js';
import { exchangeMoney } from '../utils/ExchangeMoney.js';

// For convenience: random "rotten fish" lines for when a consumer buys wasted fish.
const ROTTEN_DIALOGS = [
  "Yuck!!",
  "Ew!!!",
  "It's stinkier than I remember.",
  "*bleurg*",
  "Disgusting quality.",
  "Yuck, not coming back again.",
  "Shrek fish?"
];

// Helper to increment price by +5, +10, or +50.
function getNextPriceIncrement(countSoFar) {
  if (countSoFar <= 4) return 5;
  else if (countSoFar <= 7) return 10;
  else return 50;
}

// Re-used from older code
function computeRodPrice(nthRod) {
  let price = 8;
  for (let i = 1; i <= nthRod; i++) {
    price += getNextPriceIncrement(i);
  }
  return price;
}
function computeIceboxPrice(nthIcebox) {
  let price = 8;
  for (let i = 1; i <= nthIcebox; i++) {
    price += getNextPriceIncrement(i);
  }
  return price;
}
function computeCashRegisterPrice(nthReg) {
  let price = 8;
  for (let i = 1; i <= nthReg; i++) {
    price += getNextPriceIncrement(i);
  }
  return price;
}
function computeFarmPrice(nthFarmer) {
  // identical to computeRodPrice logic
  let price = 8;
  for (let i = 1; i <= nthFarmer; i++) {
    price += getNextPriceIncrement(i);
  }
  return price;
}

// 1) NEW HELPER: Price for fryer => chef job
function computeFryerPrice(nthFryer) {
  let price = 8;
  for (let i = 1; i <= nthFryer; i++) {
    price += getNextPriceIncrement(i);
  }
  return price;
}

export class DirectionSystem {
  update(world, deltaTime) {
    const entities = world.getEntitiesWith('Position', 'Velocity', 'Waiting');

    for (const entity of entities) {
      const pos = world.getComponent(entity, 'Position');
      const vel = world.getComponent(entity, 'Velocity');
      const waiting = world.getComponent(entity, 'Waiting');

      // 1) If waiting => countdown
      if (waiting && waiting.until > 0) {
        waiting.until -= (1 / 10) * deltaTime;
        continue;
      }

      // 2) Zero out velocity
      vel.vx = 0;
      vel.vy = 0;

      // 3) Check Supply or Demand
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
        // Farmer logic
        else if (supply.good === Goods.FARM_WORK) {
          this.handleFarmer(world, entity, deltaTime);
        }
        // Potato Seller logic
        else if (supply.good === Goods.POTATO) {
          this.handlePotatoSeller(world, entity, deltaTime);
        }
        else if (supply.good === Goods.STOCKROOM_ASSISTANT) {
          this.handleStockroomAssistant(world, entity, deltaTime);
        }
        else if (supply.good === Goods.CHEF_WORK) {
          this.handleChef(world, entity, deltaTime);
        }
        // If you want: handle Chef logic like fisher, etc. 
        // For now, it's enough that they get the hat and a price.
      } 
      else if (demand) {
        this.handleDemand(world, entity, deltaTime);
      } 
      else {
        this.handleFallback(world, entity, deltaTime);
      }

      // 4) Apply separation
      this.applySeparation(world, entity, deltaTime);
    }
  }

// --------------------------------------------------------------------
  // ADD A NEW METHOD FOR CHEF
  // --------------------------------------------------------------------
  handleChef(world, entity, dt) {
    const supply  = world.getComponent(entity, 'Supply');
    const inv     = world.getComponent(entity, 'Inventory');
    const waiting = world.getComponent(entity, 'Waiting');
  
    // Ensure a chefState
    if (!supply.chefState) {
      supply.chefState = 'IDLE';
    }
  
    const fishCount   = inv.items.fish    || 0;
    const potatoCount = inv.items.potato  || 0;
  
    // If we already have fish & potato => skip table checks
    const fryer         = this.findAnyTileOfType('fryer');
    const fishchipsCash = this.findAnyTileOfType('fishchips_cash');
  
    let potatoTable = null, fishTable = null;
    if (fishCount > 0 && potatoCount > 0) {
      if (!fryer || !fishchipsCash) {
        supply.chefState = 'IDLE';
        return;
      }
    } else {
      // We still need tables
      potatoTable = this.findTileWithAtLeastOne(world, 'potato_table', 'potato');
      fishTable   = this.findTileWithAtLeastOne(world, 'fish_table',   'fish');
      if (!potatoTable || !fishTable || !fryer || !fishchipsCash) {
        supply.chefState = 'IDLE';
        return;
      }
    }
  
    // State machine
    switch (supply.chefState) {
  
      case 'IDLE':
        if (fishCount > 0 && potatoCount > 0) {
          supply.chefState = 'GO_FRYER';
        } else {
          supply.chefState = 'GO_POTATO_TABLE';
        }
        break;
  
      case 'GO_POTATO_TABLE': {
        const arrived = this.moveTowards(world, dt, entity, potatoTable.row, potatoTable.col, 10);
        if (arrived) {
          // Only pick up ONE potato if we have none
          if (potatoCount < 1) {
            const tileInv = potatoTable.inventory;
            if (tileInv.items.potato > 0) {
              tileInv.items.potato--;
              inv.addItem('potato', 1);
            }
          }
          // Next => fish
          supply.chefState = 'GO_FISH_TABLE';
          if (waiting) waiting.until = 80; // short pause
        }
        break;
      }
  
      case 'GO_FISH_TABLE': {
        const arrived = this.moveTowards(world, dt, entity, fishTable.row, fishTable.col, 10);
        if (arrived) {
          const tileInv = fishTable.inventory;
          if (tileInv.items.fish > 0 && fishCount < 1) {
            tileInv.items.fish--;
            inv.addItem('fish', 1);
            supply.chefState = 'GO_FRYER';
          } else {
            // If no fish, or already have fish,
            // go IDLE and wait longer so we don't spam
            supply.chefState = 'IDLE';
            if (waiting) waiting.until = 600; // 10-second delay
          }
        }
        break;
      }
  
      case 'GO_FRYER': {
        const arrived = this.moveTowards(world, dt, entity, fryer.row, fryer.col, 10);
        if (arrived) {
          // Confirm we still have 1 fish + 1 potato
          const haveFish   = (inv.items.fish    || 0) > 0;
          const havePotato = (inv.items.potato  || 0) > 0;
          if (haveFish && havePotato) {
            // We'll do a 5-second wait => produce fishchips
            supply.chefState = 'FRYING';
            if (waiting) waiting.until = 300; // ~5 seconds
          } else {
            // if we somehow lost fish/potato => go idle
            supply.chefState = 'IDLE';
          }
        }
        break;
      }
  
      case 'FRYING': {
        // Once waiting is done => produce fishchips
        if (waiting && waiting.until <= 0) {
          // Remove 1 fish + 1 potato, add 1 fishchips
          if (inv.items.fish > 0)    inv.items.fish--;
          if (inv.items.potato > 0)  inv.items.potato--;
          inv.addItem('fishchips', 1);
  
          // Next => bring fishchips to fishchips_cash
          supply.chefState = 'GO_FISHCHIPS_CASH';
        }
        break;
      }
  
      case 'GO_FISHCHIPS_CASH': {
        // Move to the fish & chips register
        const arrived = this.moveTowards(world, dt, entity, fishchipsCash.row, fishchipsCash.col, 10);
        if (arrived) {
          // deposit fishchips
          const tileInv = fishchipsCash.inventory;
          if (inv.items.fishchips > 0) {
            inv.items.fishchips--;
            tileInv.addItem('fishchips', 1);
          }
  
          // Then go idle
          supply.chefState = 'IDLE';
          if (waiting) waiting.until = 100; // short break
        }
        break;
      }
    }
  }

  // --------------------------------------------------------------------
  // Helper: findAnyTileOfType(type) => returns {row, col, inventory} or null
  // --------------------------------------------------------------------
  findAnyTileOfType(tileType) {
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        const tile = tileMap[r][c];
        if (tile.type === tileType) {
          return {
            row: r,
            col: c,
            inventory: tile.inventory
          };
        }
      }
    }
    return null;
  }

  // --------------------------------------------------------------------
  // Helper: findTileWithAtLeastOne(world, tileType, itemName)
  // Looks for ANY tile of tileType that has inventory.items[itemName] >= 1
  // Returns {row, col, inventory} or null
  // --------------------------------------------------------------------
  findTileWithAtLeastOne(world, tileType, itemName) {
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        const tile = tileMap[r][c];
        if (tile.type === tileType && tile.inventory) {
          const count = tile.inventory.items[itemName] || 0;
          if (count > 0) {
            return {
              row: r,
              col: c,
              inventory: tile.inventory
            };
          }
        }
      }
    }
    return null;
  }

// ----------------------------------------------------------------------
  // STOCKROOM ASSISTANT => restocks their table (potato_table or fish_table)
  // ----------------------------------------------------------------------
  handleStockroomAssistant(world, entity, dt) {
    const supply = world.getComponent(entity, 'Supply');
    const inv = world.getComponent(entity, 'Inventory');
    const waiting = world.getComponent(entity, 'Waiting');
    if (!supply) return;

    // Which table do we own?
    const { tableRow, tableCol, stockType } = supply;
    if (tableRow == null || tableCol == null) return;
    const tableTile = tileMap[tableRow][tableCol];
    if (!tableTile || !tableTile.inventory) return;

    const tInv = tableTile.inventory;
    if (!supply.state) supply.state = 'CHECK_TABLE';

    switch (supply.state) {
      case 'CHECK_TABLE': {
        // If table has < 5 items => go buy
        const countOnTable = (tInv.items[stockType] || 0) + (tInv.items['wasted_' + stockType] || 0);
        if (countOnTable < 5) {
          supply.state = 'GO_REGISTER';
        } else {
          // else wait 5s, then check again
          if (waiting) waiting.until = 300; 
        }
        break;
      }

      case 'GO_REGISTER': {
        // Find any relevant register: "cashregister" if fish, "potato_cashregister" if potato
        const pos = world.getComponent(entity, 'Position');
        const registerType = (stockType === 'fish') 
          ? 'cashregister'
          : 'potato_cashregister';

          const target = findNearestTile(pos, registerType);
        if (!target) {
          // No register => skip
          supply.state = 'CHECK_TABLE';
          return;
        }

        // Move toward that register
        const arrived = this.moveTowards(world, dt, entity, target.row, target.col, 2);
        if (arrived) {
          // Attempt to pick up EITHER fresh or wasted
          const regTile = tileMap[target.row][target.col];
          if (regTile.inventory) {
            const regInv = regTile.inventory;

            const freshCount = regInv.items[stockType] || 0;
            const wastedCount = regInv.items['wasted_' + stockType] || 0;

            if (freshCount > 0) {
              regInv.removeItem(stockType, 1);
              inv.addItem(stockType, 1);
              // Pay occupant
              const sellerId = regTile.claimed;
              if (sellerId && sellerId !== -1) {
                const cost = supply.reservationPrice || 10;
                exchangeMoney(world, entity, sellerId, cost);
              }
            }
            else if (wastedCount > 0) {
              regInv.removeItem('wasted_' + stockType, 1);
              inv.addItem('wasted_' + stockType, 1);
              // Pay occupant
              const sellerId = regTile.claimed;
              if (sellerId && sellerId !== -1) {
                const cost = supply.reservationPrice || 10;
                exchangeMoney(world, entity, sellerId, cost);
              }
            }
            else {
              // negative
              regInv.removeItem(stockType, 1);
              inv.addItem(stockType, 1);
            }
          }
          supply.state = 'GO_TABLE';
          if (waiting) waiting.until = 80;
        }
        break;
      }

      case 'GO_TABLE': {
        // Return to the table
        const arrived = this.moveTowards(world, dt, entity, tableRow, tableCol, 2);
        if (arrived) {
          // Deposit 1 item
          if (stockType === 'fish') {
            // If we have wasted_fish, deposit that or fresh fish
            if (inv.items['wasted_fish'] > 0) {
              inv.items['wasted_fish']--;
              tInv.addItem('wasted_fish', 1);
            }
            else if (inv.items['fish'] > 0) {
              inv.items['fish']--;
              tInv.addItem('fish', 1);
            }
          }
          else if (stockType === 'potato') {
            if (inv.items['wasted_potato'] > 0) {
              inv.items['wasted_potato']--;
              tInv.addItem('wasted_potato', 1);
            }
            else if (inv.items['potato'] > 0) {
              inv.items['potato']--;
              tInv.addItem('potato', 1);
            }
          }

          supply.state = 'CHECK_TABLE';
          if (waiting) waiting.until = 80;
        }
        break;
      }
    }
  }

  // ----------------------------------------------------------------------
  // Highest-price-first logic => check if I'm the highest priced among same good
  // ----------------------------------------------------------------------
  isHighestPriceConsumer(world, entity) {
    const myDemand = world.getComponent(entity, 'Demand');
    if (!myDemand) return true;  // If no demand => trivially skip

    // Only compare among same good
    const allDemandEntities = world.getEntitiesWith('Demand');
    for (const otherId of allDemandEntities) {
      if (otherId === entity) continue;
      const d2 = world.getComponent(otherId, 'Demand');
      if (!d2) continue;
      if (d2.good !== myDemand.good) continue;

      // If that other consumer has strictly higher price
      // and has NOT locked a carpet, they should claim first
      if (d2.reservationPrice > myDemand.reservationPrice && !d2.lockedCarpet) {
        return false;
      }
    }
    return true;
  }

  // ------------------------------------------------------------------
  // FARMER logic => supply.good = FARM_WORK
  // ------------------------------------------------------------------
  handleFarmer(world, entity, dt) {
    const waiting = world.getComponent(entity, 'Waiting');
    const inv = world.getComponent(entity, 'Inventory');
    const supply = world.getComponent(entity, 'Supply');

    if (!supply.farmerState) {
      supply.farmerState = 'GO_SEED';
    }

    const seedTile = this.findSeedClaimTile(entity);
    if (!seedTile) return;

    switch (supply.farmerState) {
      case 'GO_SEED': {
        const arrived = this.moveTowards(world, dt, entity, seedTile.row, seedTile.col, 10);
        if (arrived) {
          supply.farmerState = 'GO_WATER';
        }
        break;
      }
      case 'GO_WATER': {
        const pos = world.getComponent(entity, 'Position');
        const waterTile = this.findNearestWaterTile(pos);
        if (!waterTile) return;
        const arrived = this.moveTowards(world, dt, entity, waterTile.row, waterTile.col, 10);
        if (arrived) {
          if (waiting) waiting.until = 600; // 10s
          supply.farmerState = 'WAIT_WATER';
        }
        break;
      }
      case 'WAIT_WATER': {
        if (waiting && waiting.until <= 0) {
          supply.farmerState = 'RETURN_SEED';
        }
        break;
      }
      case 'RETURN_SEED': {
        const arrived = this.moveTowards(world, dt, entity, seedTile.row, seedTile.col, 10);
        if (arrived) {
          if (waiting) waiting.until = 300; // 5s
          supply.farmerState = 'WATERING';
        }
        break;
      }
      case 'WATERING': {
        if (waiting && waiting.until <= 0) {
          const cropType = this.mapSeedToCrop(supply.seedType || 'potato_seed');
          inv.addItem(cropType, 1);
          supply.farmerState = 'HOLD_CROP';
        }
        break;
      }
      case 'HOLD_CROP': {
        const arrived = this.moveTowards(world, dt, entity, seedTile.row, seedTile.col, 5);
        if (arrived) {
          const tileInv = seedTile.inventory;
          const cropType = this.mapSeedToCrop(supply.seedType || 'potato_seed');
          tileInv.addItem(cropType, 1);
          inv.removeItem(cropType, 1);
          // indefinite production => go back to 'GO_WATER':
          supply.farmerState = 'GO_WATER';
        }
        break;
      }
      case 'DONE': {
        // do nothing
        break;
      }
    }
  }

  mapSeedToCrop(seedType) {
    switch (seedType) {
      case 'carrot_seed': return 'carrot';
      case 'corn_seed':   return 'corn';
      case 'rice_seed':   return 'rice';
      default:            return 'potato';
    }
  }

  findSeedClaimTile(entityId) {
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        if (tileMap[r][c].claimed === entityId) {
          const t = tileMap[r][c].type;
          if (
            t === 'potato_seed' ||
            t === 'carrot_seed' ||
            t === 'corn_seed'   ||
            t === 'rice_seed'
          ) {
            return {
              row: r,
              col: c,
              inventory: tileMap[r][c].inventory
            };
          }
        }
      }
    }
    return null;
  }

  findNearestWaterTile(pos) {
    const candidates = [];
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        const type = tileMap[r][c].type;
        if (type === 'ocean' || type === 'lake') {
          candidates.push({ row: r, col: c });
        }
      }
    }
    return this.closest(candidates, pos);
  }

  // ----------------------------------------------------------------------
  // FISH SELLER => supply.good = FISH
  // ----------------------------------------------------------------------
  handleFishSeller(world, entity, dt) {
    const pos = world.getComponent(entity, 'Position');
    const waiting = world.getComponent(entity, 'Waiting');
    const inv = world.getComponent(entity, 'Inventory');

    const fresh = inv.items.fish || 0;
    const wasted = inv.items.wasted_fish || 0;
    const hasFish = (fresh + wasted) > 0;

    // 1) If we have no fish, pick up from fishingrod or icebox
    if (!hasFish) {
      const rodTile = this.findTileWithFish(pos, 'fishingrod');
      const boxTile = this.findTileWithFish(pos, 'icebox');
      let candidates = [];
      if (rodTile) candidates.push(rodTile);
      if (boxTile) candidates.push(boxTile);

      const target = this.closest(candidates, pos);
      if (!target) return;

      if (this.moveTowards(world, dt, entity, target.row, target.col, 30)) {
        const tileInv = tileMap[target.row][target.col].inventory;
        // pick up fresh if possible, else wasted
        if ((tileInv.items.fish || 0) > 0) {
          tileInv.items.fish--;
          inv.items.fish = (inv.items.fish || 0) + 1;
        }
        else if ((tileInv.items.wasted_fish || 0) > 0) {
          tileInv.items.wasted_fish--;
          inv.items.wasted_fish = (inv.items.wasted_fish || 0) + 1;
        }
        if (waiting) waiting.until = 200;
      }
    }
    // 2) If we do have fish, deposit onto a cashregister
    else {
      const registerTile = this.findTileOfTypeFewestTotalFish('cashregister');
      if (!registerTile) return;
      if (this.moveTowards(world, dt, entity, registerTile.row, registerTile.col, 30)) {
        const tileInv = tileMap[registerTile.row][registerTile.col].inventory;
        const depositFresh = inv.items.fish || 0;
        const depositWasted = inv.items.wasted_fish || 0;
        inv.items.fish = 0;
        inv.items.wasted_fish = 0;

        if (depositFresh > 0) tileInv.addItem('fish', depositFresh);
        if (depositWasted > 0) tileInv.addItem('wasted_fish', depositWasted);

        if (waiting) waiting.until = 200;
      }
    }
  }

  // -------------------------------------
  // POTATO SELLER => supply.good = POTATO
  // -------------------------------------
  handlePotatoSeller(world, entity, dt) {
    const pos = world.getComponent(entity, 'Position');
    const waiting = world.getComponent(entity, 'Waiting');
    const inv = world.getComponent(entity, 'Inventory');

    // 1) Check if we have potatoes in inventory
    const havePotatoes = (inv.items.potato || 0) > 0;

    // If we have NO potatoes, find them from a tile that has 'potato_seed'
    if (!havePotatoes) {
      const sourceTile = this.findTileWithPotato(pos, 'potato_seed');
      if (!sourceTile) return; // no source => do nothing

      if (this.moveTowards(world, dt, entity, sourceTile.row, sourceTile.col, 30)) {
        // Once arrived, pick up 1 potato from the tile
        const tileInv = tileMap[sourceTile.row][sourceTile.col].inventory;
        if ((tileInv.items.potato || 0) > 0) {
          tileInv.items.potato--;
          inv.items.potato = (inv.items.potato || 0) + 1;
        }
        if (waiting) waiting.until = 200; // small wait
      }
    } 
    // 2) If we DO have potatoes, deposit them onto a "potato_cashregister"
    else {
      const registerTile = this.findTileOfTypeFewestTotalPotato('potato_cashregister');
      if (!registerTile) return;
      if (this.moveTowards(world, dt, entity, registerTile.row, registerTile.col, 30)) {
        const tileInv = tileMap[registerTile.row][registerTile.col].inventory;
        const depositCount = inv.items.potato || 0;
        inv.items.potato = 0;
        tileInv.addItem('potato', depositCount);
        
        if (waiting) waiting.until = 200;
      }
    }
  }

  // ----------------------------------------------------------------------
  // ASSISTANT => supply.good = ASSISTANT_WORK
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

        // get paid => from nearest red_carpet's occupant
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
  // FISHER => supply.good = FISH_WORK
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

        // get paid => from nearest red_carpet occupant
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
  // CONSUMER => handleDemand
  // For fish OR potato
  // ----------------------------------------------------------------------
  handleDemand(world, entity, dt) {
    const inv = world.getComponent(entity, 'Inventory');
    const demand = world.getComponent(entity, 'Demand');
    const origin = world.getComponent(entity, 'Origin');
    const waiting = world.getComponent(entity, 'Waiting');

    // If the consumer wants fish, or wants potato, handle them similarly
    if (demand.good === Goods.FISH) {
      this.handleFishConsumer(world, entity, dt);
    }
    else if (demand.good === Goods.POTATO) {
      this.handlePotatoConsumer(world, entity, dt);
    }
    // else if they want something else, you can add more logic below...
  }

  // ----------------------------------------------------------------------
  // FISH CONSUMER => never unassign red carpet + highest price first
  // ----------------------------------------------------------------------
  handleFishConsumer(world, entity, dt) {
    const inv = world.getComponent(entity, 'Inventory');
    const demand = world.getComponent(entity, 'Demand');
    const origin = world.getComponent(entity, 'Origin');
    const waiting = world.getComponent(entity, 'Waiting');

    // **Highest price check** => if not the top price => skip this frame
    if (!this.isHighestPriceConsumer(world, entity)) {
      return;
    }

    // 1) If no lockedCarpet => try to lock one
    if (!demand.lockedCarpet) {
      const carpet = this.findRandomUnlockedRedCarpet();
      if (carpet) {
        demand.lockedCarpet = { row: carpet.row, col: carpet.col };
        tileMap[carpet.row][carpet.col].lockedDemand = entity;
      }
    }
    if (!demand.lockedCarpet) return; // can't buy => skip

    // 2) If we already have fish => go home
    const freshInInv = inv.items.fish || 0;
    const wastedInInv = inv.items.wasted_fish || 0;
    if (freshInInv > 0 || wastedInInv > 0) {
      if (!origin) return;
      const row = Math.floor(origin.y / tileSize);
      const col = Math.floor(origin.x / tileSize);

      // Move home
      if (this.moveTowards(world, dt, entity, row, col, 1)) {
        // Once arrived home, remove 1 fish
        if (freshInInv > 0) {
          inv.removeItem('fish', 1);
        } else {
          inv.removeItem('wasted_fish', 1);
        }
        if (waiting) waiting.until = 2000;

        // Keep the lockedCarpet forever => do not unlock
        demand.lockedRegister = null;
        demand.demandState = null;
      }
      return;
    }

    // 3) If no lockedRegister => pick random "cashregister"
    if (!demand.lockedRegister) {
      const randReg = this.findRandomCashRegister();
      if (randReg) {
        demand.lockedRegister = { row: randReg.row, col: randReg.col };
      } else {
        // No register => go home
        if (origin) {
          const row = Math.floor(origin.y / tileSize);
          const col = Math.floor(origin.x / tileSize);
          this.moveTowards(world, dt, entity, row, col, 1);
        }
        return;
      }
    }

    // 4) If no demandState => start from GO_CARPET
    if (!demand.demandState) {
      demand.demandState = 'GO_CARPET';
    }

    switch (demand.demandState) {
      case 'GO_CARPET': {
        const { row, col } = demand.lockedCarpet;
        if (this.moveTowards(world, dt, entity, row, col, 1)) {
          demand.demandState = 'GO_REGISTER';
        }
        break;
      }
      case 'GO_REGISTER': {
        const { row, col } = demand.lockedRegister;
        if (this.moveTowards(world, dt, entity, row, col, 1)) {
          const tileInv = tileMap[row][col].inventory;
          if (!tileInv) return;

          // same fish logic
          const freshInReg = tileInv.items.fish || 0;
          const wastedInReg = tileInv.items.wasted_fish || 0;

          if (freshInReg > 0) {
            tileInv.removeItem('fish', 1);
            inv.addItem('fish', 1);
            world.reputation = (world.reputation || 0) + 2;
            const util = world.getComponent(entity, 'Utility');
            if (util) util.value += 10;
          }
          else if (wastedInReg > 0) {
            tileInv.removeItem('wasted_fish', 1);
            inv.addItem('wasted_fish', 1);
            world.reputation = (world.reputation || 0) - 10;
            const line = ROTTEN_DIALOGS[Math.floor(Math.random() * ROTTEN_DIALOGS.length)];
            oneOffTalk(world, entity, line);
            const util = world.getComponent(entity, 'Utility');
            if (util) util.value += 5;
          }
          else {
            // no fish => negative fish
            tileInv.removeItem('fish', 1);
            inv.addItem('fish', 1);
          }

          // Pay occupant of the nearest 'cashregister'
          const tileCenterX = col * tileSize + tileSize / 2;
          const tileCenterY = row * tileSize + tileSize / 2;
          const nearReg = findNearestTile({ x: tileCenterX, y: tileCenterY }, 'cashregister');
          if (nearReg) {
            const sellerId = tileMap[nearReg.row][nearReg.col].claimed;
            if (sellerId && sellerId !== -1) {
              const cost = demand.reservationPrice || 10;
              exchangeMoney(world, entity, sellerId, cost);
            }
          }
        }
        break;
      }
    }
  }

  // ----------------------------------------------------------------------
  // POTATO CONSUMER => never unassign red carpet + highest price first
  // ----------------------------------------------------------------------
  handlePotatoConsumer(world, entity, dt) {
    const inv = world.getComponent(entity, 'Inventory');
    const demand = world.getComponent(entity, 'Demand');
    const origin = world.getComponent(entity, 'Origin');
    const waiting = world.getComponent(entity, 'Waiting');

    // **Highest price check** => if not top price => skip
    if (!this.isHighestPriceConsumer(world, entity)) {
      return;
    }

    // 1) If no lockedCarpet => try to lock one
    if (!demand.lockedCarpet) {
      const carpet = this.findRandomUnlockedRedCarpet();
      if (carpet) {
        demand.lockedCarpet = { row: carpet.row, col: carpet.col };
        tileMap[carpet.row][carpet.col].lockedDemand = entity;
      }
    }
    if (!demand.lockedCarpet) return;

    // 2) If already holding potato => return home (but do NOT unassign)
    const potatoCount = inv.items.potato || 0;
    const wastedPotatoCount = inv.items.wasted_potato || 0;
    if (potatoCount > 0 || wastedPotatoCount > 0) {
      if (!origin) return;
      const row = Math.floor(origin.y / tileSize);
      const col = Math.floor(origin.x / tileSize);

      if (this.moveTowards(world, dt, entity, row, col, 1)) {
        // drop 1 potato
        if (potatoCount > 0) {
          inv.removeItem('potato', 1);
        } else {
          inv.removeItem('wasted_potato', 1);
        }
        if (waiting) waiting.until = 2000;

        // do NOT unassign the lockedCarpet => keep it forever
        demand.lockedRegister = null;
        demand.demandState = null;
      }
      return;
    }

    // 3) If no lockedRegister => pick random "potato_cashregister"
    if (!demand.lockedRegister) {
      const randPotatoReg = this.findRandomPotatoCashRegister();
      if (randPotatoReg) {
        demand.lockedRegister = { row: randPotatoReg.row, col: randPotatoReg.col };
      } else {
        // no register => go home
        if (origin) {
          const row = Math.floor(origin.y / tileSize);
          const col = Math.floor(origin.x / tileSize);
          this.moveTowards(world, dt, entity, row, col, 1);
        }
        return;
      }
    }

    if (!demand.demandState) {
      demand.demandState = 'GO_CARPET';
    }

    switch (demand.demandState) {
      case 'GO_CARPET': {
        const { row, col } = demand.lockedCarpet;
        if (this.moveTowards(world, dt, entity, row, col, 1)) {
          demand.demandState = 'GO_REGISTER';
        }
        break;
      }
      case 'GO_REGISTER': {
        const { row, col } = demand.lockedRegister;
        if (this.moveTowards(world, dt, entity, row, col, 1)) {
          const tileInv = tileMap[row][col].inventory;
          if (!tileInv) return;

          const normalPotatoes = tileInv.items.potato || 0;
          const wastedPotatoes = tileInv.items.wasted_potato || 0;

          // pick up 1 potato
          if (normalPotatoes > 0) {
            tileInv.removeItem('potato', 1);
            inv.addItem('potato', 1);
            world.reputation = (world.reputation || 0) + 2;
          }
          else if (wastedPotatoes > 0) {
            tileInv.removeItem('wasted_potato', 1);
            inv.addItem('wasted_potato', 1);
            world.reputation = (world.reputation || 0) - 10;
            // optionally oneOffTalk about rotten potato...
          }
          else {
            // no potato => negative
            tileInv.removeItem('potato', 1);
            inv.addItem('potato', 1);
          }

          // pay occupant
          const tileCenterX = col * tileSize + tileSize / 2;
          const tileCenterY = row * tileSize + tileSize / 2;
          const nearReg = findNearestTile({ x: tileCenterX, y: tileCenterY }, 'potato_cashregister');
          if (nearReg) {
            const sellerId = tileMap[nearReg.row][nearReg.col].claimed;
            if (sellerId && sellerId !== -1) {
              const cost = demand.reservationPrice || 10;
              exchangeMoney(world, entity, sellerId, cost);
            }
          }
        }
        break;
      }
    }
  }

  // ----------------------------------------------------------------------
  // handleFallback => occupant logic if no supply/demand
  // ----------------------------------------------------------------------
  handleFallback(world, entity, deltaTime) {
    const pos = world.getComponent(entity, 'Position');

    // 1) Also find the fryer tile, so blank agents can approach it
    const nearRod      = findNearestTile(pos, 'fishingrod');
    const nearFryer    = findNearestTile(pos, 'fryer');       // <--- ADDED
    const nearPotato   = findNearestTile(pos, 'potato_seed');
    const nearCarrot   = findNearestTile(pos, 'carrot_seed');
    const nearCorn     = findNearestTile(pos, 'corn_seed');
    const nearRice     = findNearestTile(pos, 'rice_seed');
    const nearFridge   = findNearestTile(pos, 'fridge');
    const nearRegister = findNearestTile(pos, 'red_carpet');
    const nearIcebox   = findNearestTile(pos, 'icebox');
    const nearLocker   = findNearestTile(pos, 'locker');  // decorative
    const nearCash     = findNearestTile(pos, 'cashregister');
    const nearPotatoCash = findNearestTile(pos, 'potato_cashregister'); 
    const nearPotatoTable = findNearestTile(pos, 'potato_table');
    const nearFishTable   = findNearestTile(pos, 'fish_table');

    const nearby = [
      nearRod, nearFryer, nearPotato, nearCarrot, nearCorn, nearRice,
      nearFridge, nearRegister, nearIcebox, nearLocker, nearCash, nearPotatoCash,
      nearPotatoTable, nearFishTable
    ];

    let tile = this.closest(nearby, pos);
    if (!tile) return;
    if (tileMap[tile.row][tile.col].claimed !== -1) return;

    const tileType = tileMap[tile.row][tile.col].type;
    switch (tileType) {
      case 'fishingrod': {
        if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
          const good = Goods.FISH_WORK;
          const quantity = 999;
          world.numFishingRodsCurrent = (world.numFishingRodsCurrent || 0) + 1;
          const nthRod = world.numFishingRodsCurrent;
          const price = computeRodPrice(nthRod);

          world.addComponent(entity, 'Supply', SupplyComponent(good, price, quantity));
          tileMap[tile.row][tile.col].claimed = entity;
        }
        break;
      }

      // 1) occupant claims 'potato_table' => becomes STOCKROOM_ASSISTANT
      case 'potato_table': {
        if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
          const good = Goods.STOCKROOM_ASSISTANT;
          const quantity = 999;
          // price logic if you want:
          world.numStockAssistants = (world.numStockAssistants || 0) + 1;
          const nthAsst = world.numStockAssistants;
          const price = 10 + nthAsst * 5; 

          const supplyComp = {
            good,
            reservationPrice: price,
            quantity,
            stockType: 'potato',   // so we know what to restock
            tableRow: tile.row,
            tableCol: tile.col,
          };
          world.addComponent(entity, 'Supply', supplyComp);
          tileMap[tile.row][tile.col].claimed = entity;
        }
        break;
      }
      // 2) occupant claims 'fish_table' => STOCKROOM_ASSISTANT with stockType= 'fish'
      case 'fish_table': {
        if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
          const good = Goods.STOCKROOM_ASSISTANT;
          const quantity = 999;

          world.numStockAssistants = (world.numStockAssistants || 0) + 1;
          const nthAsst = world.numStockAssistants;
          const price = 10 + nthAsst * 5; 

          const supplyComp = {
            good,
            reservationPrice: price,
            quantity,
            stockType: 'fish',
            tableRow: tile.row,
            tableCol: tile.col,
          };
          world.addComponent(entity, 'Supply', supplyComp);
          tileMap[tile.row][tile.col].claimed = entity;
        }
        break;
      }

      // 2) NEW: occupant claims 'fryer' => becomes CHEF (like fisherman)
      case 'fryer': {
        if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
          const good = Goods.CHEF_WORK;   // must exist in your Goods.js
          const quantity = 999;
          // Keep track of how many fryers so the price increments
          world.numFryersCurrent = (world.numFryersCurrent || 0) + 1;
          const nthFryer = world.numFryersCurrent;
          const price = computeFryerPrice(nthFryer);

          // Add Supply => the agent is now "hired" as a chef
          world.addComponent(entity, 'Supply', SupplyComponent(good, price, quantity));

          // Mark the fryer tile as claimed
          tileMap[tile.row][tile.col].claimed = entity;
        }
        break;
      }

      // occupant claims 'potato_cashregister' => becomes potato seller
      case 'potato_cashregister': {
        if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
          const good = Goods.POTATO;
          const quantity = 999;
          world.numPotatoRegistersCurrent = (world.numPotatoRegistersCurrent || 0) + 1;
          const nthPotatoReg = world.numPotatoRegistersCurrent;
          const price = computeCashRegisterPrice(nthPotatoReg);

          world.addComponent(entity, 'Supply', SupplyComponent(good, price, quantity));
          tileMap[tile.row][tile.col].claimed = entity;
        }
        break;
      }

      case 'icebox': {
        if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
          const good = Goods.ASSISTANT_WORK;
          const quantity = 999;

          world.numIceboxesCurrent = (world.numIceboxesCurrent || 0) + 1;
          const nthBox = world.numIceboxesCurrent;
          const price = computeIceboxPrice(nthBox);

          world.addComponent(entity, 'Supply', SupplyComponent(good, price, quantity));
          tileMap[tile.row][tile.col].claimed = entity;
        }
        break;
      }

      // This second 'icebox' block was in original code, we keep it:
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
        // decorative now
        break;
      }

      case 'cashregister': {
        if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
          const good = Goods.FISH;
          const quantity = 999;
          world.numCashRegistersCurrent = (world.numCashRegistersCurrent || 0) + 1;
          const nthReg = world.numCashRegistersCurrent;
          const price = computeCashRegisterPrice(nthReg);

          world.addComponent(entity, 'Supply', SupplyComponent(good, price, quantity));
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

      // Seeds => occupant => supply = FARM_WORK
      case 'potato_seed':
      case 'carrot_seed':
      case 'corn_seed':
      case 'rice_seed': {
        if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
          const good = Goods.FARM_WORK;
          const quantity = 999;

          world.numFarmersCurrent = (world.numFarmersCurrent || 0) + 1;
          const nthFarmer = world.numFarmersCurrent;
          const price = computeFarmPrice(nthFarmer);

          world.addComponent(entity, 'Supply', SupplyComponent(good, price, quantity));
          tileMap[tile.row][tile.col].claimed = entity;
        }
        break;
      }

      // red_carpet => skip claiming
    }
  }

  // ----------------------------------------------------------------
  // findRandomUnlockedRedCarpet => for UI assignment
  // ----------------------------------------------------------------
  findRandomUnlockedRedCarpet() {
    const carpets = [];
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        const tile = tileMap[r][c];
        if (tile.type === 'red_carpet' && tile.lockedDemand == null) {
          carpets.push({ row: r, col: c });
        }
      }
    }
    if (carpets.length === 0) return null;
    return carpets[Math.floor(Math.random() * carpets.length)];
  }

  // ----------------------------------------------------------------
  // findRandomCashRegister => returns ANY 'cashregister'
  // ----------------------------------------------------------------
  findRandomCashRegister() {
    const registers = [];
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        const tile = tileMap[r][c];
        if (tile.type === 'cashregister') {
          registers.push({ row: r, col: c });
        }
      }
    }
    if (registers.length === 0) return null;
    return registers[Math.floor(Math.random() * registers.length)];
  }

  // NEW/CHANGED: find a random 'potato_cashregister'
  findRandomPotatoCashRegister() {
    const registers = [];
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        const tile = tileMap[r][c];
        if (tile.type === 'potato_cashregister') {
          registers.push({ row: r, col: c });
        }
      }
    }
    if (registers.length === 0) return null;
    return registers[Math.floor(Math.random() * registers.length)];
  }

  // ----------------------------------------------------------------
  // findTileOfTypeFewestTotalFish
  // ----------------------------------------------------------------
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

  // NEW/CHANGED: find tile with fewest total potatoes
  findTileOfTypeFewestTotalPotato(tileType) {
    let best = null;
    let minCount = Infinity;
  
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        const tile = tileMap[r][c];
        if (tile.type === tileType && tile.inventory) {
          const inv = tile.inventory.items;
          const totalPotatoHere = (inv.potato || 0);
          if (totalPotatoHere < minCount) {
            minCount = totalPotatoHere;
            best = { row: r, col: c };
          }
        }
      }
    }
    return best;
  }

  // ----------------------------------------------------------------
  // findTileWithAnyFish
  // ----------------------------------------------------------------
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

  // NEW/CHANGED: find tile with 'potato'
  findTileWithAnyPotato(pos, tileType) {
    const candidates = [];
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        if (tileMap[r][c].type === tileType) {
          const inv = tileMap[r][c].inventory;
          if (!inv) continue;
          const count = inv.items.potato || 0;
          if (count > 0) {
            candidates.push({ row: r, col: c });
          }
        }
      }
    }
    return this.closest(candidates, pos);
  }

  findTileWithPotato(pos, tileType) {
    const candidates = [];
    for (let r = 0; r < tileMap.length; r++) {
      for (let c = 0; c < tileMap[r].length; c++) {
        if (tileMap[r][c].type === tileType) {
          const inv = tileMap[r][c].inventory;
          if (inv && (inv.items.potato || 0) > 0) {
            candidates.push({ row: r, col: c });
          }
        }
      }
    }
    return this.closest(candidates, pos);
  }

  // ----------------------------------------------------------------
  // Movement + separation
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // closest => standard helper
  // ----------------------------------------------------------------
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
