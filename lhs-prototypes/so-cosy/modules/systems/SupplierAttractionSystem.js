// modules/systems/SupplierAttractionSystem.js

import { Goods } from '../data/Goods.js';

export class SupplierAttractionSystem {
  constructor(world) {
    this.world = world;
  }

  update(deltaTime) {
    // Retrieve all suppliers
    const suppliers = this.world.getEntitiesByComponents(['Supply', 'AttractionRadius', 'Position']);

    // Retrieve all demanders
    const demanders = this.world.getEntitiesByComponents(['Demand', 'Position', 'Velocity']);

    suppliers.forEach(supplierId => {
      const supplierSupply = this.world.getComponent(supplierId, 'Supply');
      const supplierRadius = this.world.getComponent(supplierId, 'AttractionRadius').radius;
      const supplierReservationPrice = this.world.getComponent(supplierId, 'ReservationPrice').price;
      const supplierPos = this.world.getComponent(supplierId, 'Position');

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

        // Define buffer distance to prevent overlapping (e.g., 20 pixels)
        const bufferDistance = 20;
        if (distance < bufferDistance) return;

        // Calculate direction vector (normalized)
        const directionX = dx / distance;
        const directionY = dy / distance;

        // Define attraction strength (can be adjusted)
        const attractionStrength = 50; // Pixels per second squared

        // Update the demander's velocity to move towards the supplier
        demanderVel.vx += directionX * attractionStrength * deltaTime;
        demanderVel.vy += directionY * attractionStrength * deltaTime;

        // Optionally, cap the maximum velocity to prevent excessive speeds
        const maxVelocity = 5; // Adjust as needed
        const currentSpeed = Math.sqrt(demanderVel.vx * demanderVel.vx + demanderVel.vy * demanderVel.vy);
        if (currentSpeed > maxVelocity) {
          demanderVel.vx = (demanderVel.vx / currentSpeed) * maxVelocity;
          demanderVel.vy = (demanderVel.vy / currentSpeed) * maxVelocity;
        }
      });
    });
  }
}
