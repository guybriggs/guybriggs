import { Goods } from '../data/Goods.js';
import { isInFullyEnclosedRegion, getHouseWalls } from '../utils/EnvironmentUtils.js';
import { tileMap } from '../tile/TileMap.js';

const ARRIVAL_THRESHOLD = 50; // Pixels

export class SupplierAttractionSystem {
  constructor(world) {
    this.world = world;
  }

  update(deltaTime) {
    // Retrieve all suppliers
    const suppliers = this.world.getEntitiesByComponents(['Supply', 'Position']);

    // Retrieve all demanders
    const demanders = this.world.getEntitiesByComponents(['Demand', 'Position', 'Velocity']);

    suppliers.forEach(supplierId => {
      const supplierSupply = this.world.getComponent(supplierId, 'Supply');
      const supplierPos = this.world.getComponent(supplierId, 'Position');

      // Check if supplier is inside a house
      const insideHouse = isInFullyEnclosedRegion(supplierPos);

      if (insideHouse) {
        // Check if the supplier has already been upgraded to prevent redundant operations
        const isUpgraded = this.world.getComponent(supplierId, 'Upgraded');
        if (!isUpgraded) {
          // Change walls to 'stone_bricks'
          const wallTiles = getHouseWalls(supplierPos);
          wallTiles.forEach(tilePos => {
            const tile = tileMap[tilePos.gy][tilePos.gx];
            if (tile.type === 'wall') {
              tile.type = 'stone_bricks';
            }
          });
          // Mark supplier as upgraded
          this.world.addComponent(supplierId, 'Upgraded', { value: true });
        }
      }

      // Only proceed with attraction if the supplier is inside a house
      if (!insideHouse) return;

      // Existing Attraction Logic
      const supplierRadius = 500;
      const supplierReservationPrice = supplierSupply.reservationPrice;
      // supplierPos already obtained

      demanders.forEach(demanderId => {
        const demanderDemand = this.world.getComponent(demanderId, 'Demand');
        const demanderPos = this.world.getComponent(demanderId, 'Position');
        const demanderVel = this.world.getComponent(demanderId, 'Velocity');

        // Check if the demander wants the good supplied by the supplier
        if (demanderDemand.good !== supplierSupply.good) return;

        // Check if the demander is willing to pay more than the supplier's reservation price
        if (demanderDemand.price < supplierReservationPrice) return;

        // Calculate distance between supplier and demander
        const dx = supplierPos.x - demanderPos.x;
        const dy = supplierPos.y - demanderPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if the demander is within the supplier's attraction radius
        if (distance > supplierRadius) return;

        // Define buffer distance to prevent overlapping (e.g., 50 pixels)
        const bufferDistance = ARRIVAL_THRESHOLD;
        if (distance < bufferDistance) {
          // Gradually reduce velocity for smooth stopping
          demanderVel.vx *= 0.9;
          demanderVel.vy *= 0.9;

          // If velocity is below a small threshold, stop completely
          const speed = Math.sqrt(demanderVel.vx * demanderVel.vx + demanderVel.vy * demanderVel.vy);
          if (speed < 0.1) {
            demanderVel.vx = 0;
            demanderVel.vy = 0;
            this.world.addComponent(demanderId, 'Arrived', { value: true });

            // Optionally, trigger an interaction or transaction
            // this.handleInteraction(demanderId, supplierId);
          }

          return; // Skip further attraction processing
        }

        // Calculate direction vector (normalized)
        const directionX = dx / distance;
        const directionY = dy / distance;

        // Define attraction strength (can be adjusted)
        const attractionStrength = 50; // Pixels per second squared

        // Update the demander's velocity to move towards the supplier
        demanderVel.vx += directionX * attractionStrength * deltaTime;
        demanderVel.vy += directionY * attractionStrength * deltaTime;

        // Optionally, cap the maximum velocity to prevent excessive speeds
        const maxVelocity = 1; // Adjust as needed
        const currentSpeed = Math.sqrt(demanderVel.vx * demanderVel.vx + demanderVel.vy * demanderVel.vy);
        if (currentSpeed > maxVelocity) {
          demanderVel.vx = (demanderVel.vx / currentSpeed) * maxVelocity;
          demanderVel.vy = (demanderVel.vy / currentSpeed) * maxVelocity;
        }
      });
    });
  }
}
