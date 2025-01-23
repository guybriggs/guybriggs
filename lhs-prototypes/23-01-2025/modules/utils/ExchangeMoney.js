export let log = [];

export function logMessage(text) {
  log.splice(0, 0, text);
  if (log.length > 16) log.splice(log.length-1, 1);
}

export function exchangeMoney(world, from, to, cost) {
  const fromName = world.getComponent(from, 'Name');
  const toName = world.getComponent(to, 'Name');
    
  const fromIsFollower = world.getComponent(from, 'Follower');
  const toIsFollower = world.getComponent(to, 'Follower');
  
  const fromMoney = world.getComponent(from, 'Money');
  const toMoney = world.getComponent(to, 'Money');

  const moneyEntities = world.getEntitiesWith('Money');
  const playerMoney = world.getComponent(moneyEntities[0], 'Money');

  if (!fromMoney || !toMoney || !playerMoney) {
      console.log("tried to exchange money, but couldn't");
      return;
  }

  if (fromIsFollower && toIsFollower) {
    // well... money is conserved...
  } if (fromIsFollower) {
    playerMoney.amount -= cost;
    toMoney.amount += cost;
  }
  else if (toIsFollower) {
    //console.log(`${from} | ${fromName.firstName} | ${fromIsFollower} to ${to} | ${toName.firstName} | ${toIsFollower} exchanged ${cost}.`);
    fromMoney.amount -= cost;
    playerMoney.amount += cost;
  } 
  else {
    fromMoney.amount -= cost;
    toMoney.amount += cost;
  }

  const fs = world.getComponent(from, 'Supply')
  const ts = world.getComponent(to, 'Supply')
  const fd = world.getComponent(from, 'Demand')
  const td = world.getComponent(to, 'Demand')

  const gfs = fs ? fs.good : '_';
  const gts = ts ? ts.good : '_';
  const gfd = fd ? fd.good : '_';
  const gtd = td ? td.good : '_';

  logMessage(`$${cost} paid from ${fromName.firstName} ($${fromMoney.amount}) to ${toName.firstName} ($${toMoney.amount}) [${gfs} | ${gts} | ${gfd} | ${gtd}]`);
}