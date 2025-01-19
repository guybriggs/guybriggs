// modules/systems/DirectionSystem.js

import { Goods } from '../data/Goods.js';
import { findNearestTile } from '../utils/EnvironmentUtils.js';
import { InventoryComponent } from '../components/Inventory.js';
import { tileMap, tileSize } from '../tile/TileMap.js';
import { SupplyComponent } from '../components/Supply.js';
import { DemandComponent } from '../components/Demand.js';
import { RandomRange } from '../utils/RandomRange.js';
import { oneOffTalk } from '../systems/TalkInteractionSystem.js';

// this is the almighty direction system. it decides the velocity of an entity, using the entities' components as it's logic

export class DirectionSystem {
  update(world, deltaTime) {
    const entities = world.getEntitiesWith('Position', 'Velocity', 'Waiting'); // get all entities with a position and velocity

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

      if (waiting.until > 0) {
        waiting.until -= 1/10 * deltaTime;
        continue;
      }

      vel.vx = 0;
      vel.vy = 0;

      if (supply) {
        if (supply.good == Goods.FISH) {
          if (inventory.hasItem(Goods.FISH)) {
            let tile = findNearestTile(pos, 'cashregister');
            if (!tile) continue;
            if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
              supply.openForBusiness = true;
            }
          } else {
            let tile = findNearestTile(pos, 'ocean');
            if (!tile) continue;
            if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
              inventory.addItem(Goods.FISH, 1);
              waiting.until = 500;
              supply.openForBusiness = false;
            }
          }
        }
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

          if (this.moveTowards(world, deltaTime, entity, (supplyPos.y-tileSize/2) / tileSize, (supplyPos.x-tileSize/2) / tileSize, 50)) {
            oneOffTalk(world, entity, "I can't afford that!");
            waiting.until = 5000;
          }

        } else {

          if (this.moveTowards(world, deltaTime, entity, (supplyPos.y-tileSize/2) / tileSize, (supplyPos.x-tileSize/2) / tileSize, 1)) {
            if (supplyInv.items.fish > 0) {
              supplyInv.items.fish -= 1;
              demandInv.items.fish = (demandInv.items.fish || 0) + 1;

              const moneyEntities = world.getEntitiesWith('Money');
              const mComp = world.getComponent(moneyEntities[0], 'Money');

              if (demandIsFollower) {
                mComp.amount -= price;
                supplyMoney.amount += price;
              }
              
              if (supplyIsFollower) {
                mComp.amount += price;
                demandMoney.amount -= price;
              }
              
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

      } else { // no supply or demand components - they want something to do!

        let nearby = [
          findNearestTile(pos, 'fishingrod'),
          findNearestTile(pos, 'fridge')
        ];

        let tile = this.closest(nearby, pos);
        if (!tile) continue;
        if (tileMap[tile.row][tile.col].claimed) continue;

        switch (tileMap[tile.row][tile.col].type) {
          case 'fishingrod':
            if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
              const good = Goods.FISH;
              const reservationPrice = RandomRange(8, 15);
              const quantity = 999;
              world.addComponent(entity, 'Supply', SupplyComponent(good, reservationPrice, quantity));
    
              tileMap[tile.row][tile.col].claimed = true;
            }
            break;
          case 'fridge':
            if (this.moveTowards(world, deltaTime, entity, tile.row, tile.col, 1)) {
              const good = Goods.FISH;
              const reservationPrice = RandomRange(8, 15);
              const quantity = 999;
              world.addComponent(entity, 'Demand', DemandComponent(good, reservationPrice, quantity));
    
              tileMap[tile.row][tile.col].claimed = true;
            }
            break;
        }

      }

    }
  }

  closest(array, pos) {
    let closestTile = null;
    let minDist = Infinity;
    
    for (let tile of array) {
      if (!tile) continue; 

      let a = tile.col ? tile.col : tile.x ? tile.x / tileSize : null;
      let b = tile.row ? tile.row : tile.y ? tile.y / tileSize : null;

      if (!a || !b) continue;
    
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

  moveTowards(world, deltaTime, entity, row, col, threshold) {
    const pos = world.getComponent(entity, 'Position');
    const vel = world.getComponent(entity, 'Velocity');

    const ddx = col*tileSize - pos.x + tileSize/2;
    const ddy = row*tileSize - pos.y + tileSize/2;
    const d = Math.hypot(ddx, ddy);

    if (d > threshold) {
      const speed = 1/10;
      vel.vx = (ddx / d) * speed * deltaTime;
      vel.vy = (ddy / d) * speed * deltaTime;

      return false;
    } else {
      vel.vx = 0;
      vel.vy = 0;

      return true;
    }
  }
}
  