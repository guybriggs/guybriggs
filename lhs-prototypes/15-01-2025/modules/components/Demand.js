// modules/components/Demand.js

import { Goods } from '../data/Goods.js';

export function DemandComponent(good, reservationPrice, quantity) {
  if (!Object.values(Goods).includes(good)) {
    console.warn(`Invalid good '${good}' for Demand component. Falling back to default 'Carrots'.`);
    good = Goods.CARROTS; // Default good
  }
  return { good, reservationPrice, quantity };
}
