import { Goods } from '../data/Goods.js';
import { MoneyComponent } from '../components/Money.js';

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

        const supplyPos = world.getComponent(supplyId, 'Position');
        const supplyInv = world.getComponent(supplyId, 'Inventory');
        const supplyVel = world.getComponent(supplyId, 'Velocity');

        let supplierMoney = world.getComponent(supplyId, 'Money');
        if (!supplierMoney) {
          world.addComponent(supplyId, 'Money', MoneyComponent(0));
          supplierMoney = world.getComponent(supplyId, 'Money');
        }

        // Handle demanders who cannot afford the fish
        if (demand.reservationPrice <= supply.reservationPrice) {
          const dx = supplyPos.x - demandPos.x;
          const dy = supplyPos.y - demandPos.y;
          const dist = Math.hypot(dx, dy);
          // When near the supplier (approximation of being "on the cash register")
          if (dist < 50) {
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
          }
          //return; // Skip trading for this supply for current demander
        }

        // Buyer logic: reservation price exceeds supplier's price
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
            supplyInv.items.fish -= 1;
            demandInv.items.fish = (demandInv.items.fish || 0) + 1;
            const price = supply.reservationPrice;
            demandMoney.amount -= price;
            supplierMoney.amount += price;
            console.log(`Trade completed: Demand ${demandId} bought fish from Supply ${supplyId} for ${price}.`);

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
          }
        }
      });
    });
  }
}
