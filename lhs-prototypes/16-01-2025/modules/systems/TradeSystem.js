import { Goods } from '../data/Goods.js';
import { MoneyComponent } from '../components/Money.js';

export class TradeSystem {
  constructor(world, buildingSystem) {
    this.world = world;
    this.buildingSystem = buildingSystem;
  }

  getAllCashRegisters() {
    // Filter non-grid buildings to return only cash registers
    return this.buildingSystem.nonGridBuildings.filter(building => building.type === 'cash_register');
  }

  isNearCashRegister(supplyPos) {
    const cashRegisters = this.getAllCashRegisters();
    const threshold = 50; // Distance threshold for being 'next to' a cash register

    for (const register of cashRegisters) {
      const centerX = register.x + register.w / 2;
      const centerY = register.y + register.h / 2;
      const dx = supplyPos.x - centerX;
      const dy = supplyPos.y - centerY;
      if (Math.hypot(dx, dy) < threshold) {
        return true;
      }
    }
    return false;
  }

  update(world, deltaTime) {
    // Retrieve all suppliers and demands
    const supplies = world.getEntitiesByComponents(['Supply', 'Inventory', 'Position', 'Velocity', 'Money']);
    const demands = world.getEntitiesByComponents(['Demand', 'Inventory', 'Position', 'Velocity', 'Money']);

    // Update each supplier's openForBusiness flag based on proximity to a cash register
    supplies.forEach(supplyId => {
      const supply = world.getComponent(supplyId, 'Supply');
      const supplyPos = world.getComponent(supplyId, 'Position');
      supply.openForBusiness = this.isNearCashRegister(supplyPos);
    });

    demands.forEach(demandId => {
      const demand = world.getComponent(demandId, 'Demand');
      if (demand.good !== Goods.FISH) return;

      const demandPos = world.getComponent(demandId, 'Position');
      const demandVel = world.getComponent(demandId, 'Velocity');
      const demandInv = world.getComponent(demandId, 'Inventory');

      let demandMoney = world.getComponent(demandId, 'Money');
      if (!demandMoney) {
        world.addComponent(demandId, 'Money', MoneyComponent(0));
        demandMoney = world.getComponent(demandId, 'Money');
      }

      supplies.forEach(supplyId => {
        const supply = world.getComponent(supplyId, 'Supply');
        if (supply.good !== Goods.FISH) return;
        
        // Check if supplier is open for business
        if (!supply.openForBusiness) {
          return;  // Skip this supplier if not open
        }

        const supplyPos = world.getComponent(supplyId, 'Position');
        const supplyInv = world.getComponent(supplyId, 'Inventory');
        const supplyVel = world.getComponent(supplyId, 'Velocity');

        let supplierMoney = world.getComponent(supplyId, 'Money');
        if (!supplierMoney) {
          world.addComponent(supplyId, 'Money', MoneyComponent(0));
          supplierMoney = world.getComponent(supplyId, 'Money');
        }

        const dx = supplyPos.x - demandPos.x;
        const dy = supplyPos.y - demandPos.y;
        let dist = Math.hypot(dx, dy);

        // Case 1: Demander cannot afford the fish
        if (demand.reservationPrice <= supply.reservationPrice) {
          if (dist > 50) {
            // Move towards supplier until ~50 units away
            const speed = 1 / 10;
            demandVel.vx = (dx / dist) * speed * deltaTime;
            demandVel.vy = (dy / dist) * speed * deltaTime;
          } else {
            // Within ~50 units: Show speech bubble and stop moving closer
            const speech = world.getComponent(demandId, 'SpeechBubble');
            if (!speech || !speech.visible) {
              world.addComponent(demandId, 'SpeechBubble', {
                textOptions: [],
                fullText: "Since when did fish get so pricey?",
                typed: '',
                index: 0,
                visible: true,
                xOffset: 0,
                yOffset: -40,
                bubbleColor: 'white',
                textColor: '#000000'
              });
              setTimeout(() => {
                const s = world.getComponent(demandId, 'SpeechBubble');
                if (s) s.visible = false;
              }, 3000);
            }
            // Stop further movement
            demandVel.vx = 0;
            demandVel.vy = 0;
          }
          // Skip further logic for this supply for current demander
          return;
        }

        // Case 2: Demander can afford the fish
        // First, ensure they are set up at the cash register (~50 units away)
        if (dist > 50) {
          const speed = 1 / 10;
          demandVel.vx = (dx / dist) * speed * deltaTime;
          demandVel.vy = (dy / dist) * speed * deltaTime;
        } else if (dist > 1) {
          // Once near the cash register, continue toward the supplier
          const speed = 1 / 10;
          demandVel.vx = (dx / dist) * speed * deltaTime;
          demandVel.vy = (dy / dist) * speed * deltaTime;
        } else {
          // At supplier: complete transaction if supplier has fish
          if (supplyInv.items.fish > 0) {
            supplyInv.items.fish -= 1;
            demandInv.items.fish = (demandInv.items.fish || 0) + 1;
            const price = supply.reservationPrice;
            demandMoney.amount -= price;
            supplierMoney.amount += price;


            // add to player balance!
            const demandIsFollower = world.hasComponent(demandId, 'Follower');
            const supplyIsFollower = world.hasComponent(supplyId, 'Follower');
            if (demandIsFollower || supplyIsFollower) {
              console.log('one of your followers traded!');
              const moneyEntities = world.getEntitiesWith('Money');
              if (moneyEntities.length > 0) {
                const mComp = world.getComponent(moneyEntities[0], 'Money');
                if (demandIsFollower) {
                  mComp.amount -= price;
                }
                if (supplyIsFollower) {
                  mComp.amount += price;
                }
              }
            }


            console.log(`Trade completed: Demand ${demandId} bought fish from Supply ${supplyId} for ${price}.`);

            // Capture original demand details for reuse
            const originalReservationPrice = demand.reservationPrice;
            const originalGood = demand.good;

            // After purchase, remove demand and assign random movement (simulate leaving)
            world.removeComponent(demandId, 'Demand');
            world.addComponent(demandId, 'RandomlyMove');

            // Set velocity to move away from the supplier to simulate leaving
            const awayDx = demandPos.x - supplyPos.x;
            const awayDy = demandPos.y - supplyPos.y;
            const awayDist = Math.hypot(awayDx, awayDy) || 1;
            const leaveSpeed = 2;
            demandVel.vx = (awayDx / awayDist) * leaveSpeed;
            demandVel.vy = (awayDy / awayDist) * leaveSpeed;

            // After 10 seconds, remove random movement and reintroduce the demand
            setTimeout(() => {
              world.removeComponent(demandId, 'RandomlyMove');
              world.addComponent(demandId, 'Demand', { 
                good: originalGood, 
                reservationPrice: originalReservationPrice 
              });
            }, 10000);
          }
        }
      });
    });
  }
}
