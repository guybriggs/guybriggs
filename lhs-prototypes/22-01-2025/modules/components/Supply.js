// modules/components/Supply.js

import { Goods } from '../data/Goods.js';

export function SupplyComponent(good, reservationPrice, quantity, openForBusiness = false) {
  if (!Object.values(Goods).includes(good)) {
    console.warn(`Invalid good '${good}' for Supply component. Falling back to default 'Carrots'.`);
    good = Goods.CARROTS; // Default good
  }
  return { good, reservationPrice, quantity, openForBusiness };
}
