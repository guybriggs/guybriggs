// ExchangeMoney.js

export let log = [];

// We insert new log entries at the front (index 0). 
// We keep only the most recent 16 for display.
export function logMessage(text) {
  // Insert at the front
  log.splice(0, 0, text);
  // Trim older messages if >16
  if (log.length > 16) {
    log.splice(log.length - 1, 1);
  }
}

export function exchangeMoney(world, from, to, cost) {
  const fromName = world.getComponent(from, 'Name');
  const toName   = world.getComponent(to, 'Name');

  const fromIsFollower = world.getComponent(from, 'Follower');
  const toIsFollower   = world.getComponent(to, 'Follower');

  const fromMoney = world.getComponent(from, 'Money');
  const toMoney   = world.getComponent(to, 'Money');

  // Optional: to track player's money specifically
  const moneyEntities = world.getEntitiesWith('Money');
  const playerMoney   = world.getComponent(moneyEntities[0], 'Money');

  // Safeguard
  if (!fromMoney || !toMoney || !playerMoney) {
    console.log("Tried to exchange money, but couldn't find money components.");
    return;
  }

  // Handle special follower -> player or player -> follower cases
  if (fromIsFollower && toIsFollower) {
    // Two followers exchanging basically keeps total money the same
    // so you could do nothing or just do fromMoney.amount -= cost;
    // toMoney.amount   += cost;
  } 
  else if (fromIsFollower) {
    // Follower pays => we decrement from player's money
    playerMoney.amount -= cost;
    toMoney.amount     += cost;
  }
  else if (toIsFollower) {
    // Paying the follower => money goes from 'from' to player's stash
    fromMoney.amount   -= cost;
    playerMoney.amount += cost;
  } 
  else {
    // Normal case
    fromMoney.amount -= cost;
    toMoney.amount   += cost;
  }

  // For debugging: figure out which goods the two sides have
  const fs = world.getComponent(from, 'Supply');
  const ts = world.getComponent(to,   'Supply');
  const fd = world.getComponent(from, 'Demand');
  const td = world.getComponent(to,   'Demand');

  const gfs = fs ? fs.good : '_';
  const gts = ts ? ts.good : '_';
  const gfd = fd ? fd.good : '_';
  const gtd = td ? td.good : '_';

  // Log it
  const fromLabel = fromName ? fromName.firstName : `Entity#${from}`;
  const toLabel   = toName   ? toName.firstName   : `Entity#${to}`;
  logMessage(
    `$${cost} paid from ${fromLabel} ($${fromMoney.amount}) to ${toLabel} ($${toMoney.amount}) [${gfs} | ${gts} | ${gfd} | ${gtd}]`
  );
}
