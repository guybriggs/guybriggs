import { Goods } from '../data/Goods.js';
import { MoneyComponent } from '../components/Money.js';
import { BehaviorComponent, BehaviorTypes } from '../components/Behavior.js';

export class TradeSystem {
  update(world, deltaTime) {
    // Find all demand and supply agents interested in fish
    const demands = world.getEntitiesByComponents(['Demand', 'Inventory', 'Position', 'Velocity', 'Money']);
    const supplies = world.getEntitiesByComponents(['Supply', 'Inventory', 'Position', 'Velocity', 'Money']);

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
        // Check if buyer's reservation price exceeds supplier's price
        if (demand.reservationPrice <= supply.reservationPrice) return;

        const supplyPos = world.getComponent(supplyId, 'Position');
        const supplyInv = world.getComponent(supplyId, 'Inventory');
        const supplyVel = world.getComponent(supplyId, 'Velocity');
        let supplierMoney = world.getComponent(supplyId, 'Money');
        if (!supplierMoney) {
          world.addComponent(supplyId, 'Money', MoneyComponent(0));
          supplierMoney = world.getComponent(supplyId, 'Money');
        }

        // Direct the demand agent toward the supplier
        const dx = supplyPos.x - demandPos.x;
        const dy = supplyPos.y - demandPos.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
          const speed = 1 / 10;
          demandVel.vx = (dx / dist) * speed * deltaTime;
          demandVel.vy = (dy / dist) * speed * deltaTime;
        } else {
          // At supplier: complete transaction if supplier has fish
          if (supplyInv.items.fish > 0) {
            // Transfer fish from supplier to demander
            supplyInv.items.fish -= 1;
            demandInv.items.fish = (demandInv.items.fish || 0) + 1;
            // Exchange money based on supplier's reservation price
            const price = supply.reservationPrice;
            demandMoney.amount -= price;
            supplierMoney.amount += price;
            console.log(`Trade completed: Demand ${demandId} bought fish from Supply ${supplyId} for ${price}.`);
            
            // Reset demander behavior: remove Demand and assign wandering behavior
            world.removeComponent(demandId, 'Demand');
            world.addComponent(demandId, 'Behavior', BehaviorComponent(BehaviorTypes.WANDER, {}));
          }
        }
      });
    });
  }
}
