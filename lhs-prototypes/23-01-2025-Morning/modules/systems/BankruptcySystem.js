import { World } from '../core/World.js';  // Adjust import paths as needed

export class BankruptcySystem {
  constructor(bankruptcyThreshold = -100) {
    this.bankruptcyThreshold = bankruptcyThreshold;
  }

  update(world, deltaTime) {
    // Get all entities that have a Money component
    const entities = world.getEntitiesWith('Money');

    // Check each entity for bankruptcy
    for (const entity of entities) {
      const moneyComp = world.getComponent(entity, 'Money');
      if (!moneyComp) continue;

      // If the entity is below the bankruptcy threshold, start the bailout process
      if (moneyComp.amount < this.bankruptcyThreshold) {
        let required = -(moneyComp.amount);  // amount needed to bring balance to 0

        // Gather potential donors: all other entities with some money
        let donors = entities.filter(e => {
          if (e === entity) return false;
          const comp = world.getComponent(e, 'Money');
          return comp && comp.amount > 0;
        });

        // Perform iterative equal distribution among donors
        while (required > 0 && donors.length > 0) {
          // Recalculate equal share based on current donors
          const equalShare = required / donors.length;
          const remainingDonors = [];

          for (const donor of donors) {
            const donorMoney = world.getComponent(donor, 'Money');
            if (!donorMoney || donorMoney.amount <= 0) continue;

            // Each donor contributes the lesser of their available money or the equal share
            const contribution = Math.min(donorMoney.amount, equalShare);
            donorMoney.amount -= contribution;
            moneyComp.amount += contribution;
            required -= contribution;

            // If the donor still has money left, they remain in the pool for further contributions
            if (donorMoney.amount > 0) {
              remainingDonors.push(donor);
            }
          }

          // Update donors list for the next iteration
          donors = remainingDonors;
        }

        // Log or handle post-bailout behavior if needed
        if (moneyComp.amount >= 0) {
          console.log(`Entity ${entity} has been bailed out to $0 or above.`);
        }
      }
    }
  }
}
