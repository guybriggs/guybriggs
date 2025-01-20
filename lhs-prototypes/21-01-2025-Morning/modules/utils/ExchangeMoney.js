export function exchangeMoney(world, from, to, cost) {
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
      fromMoney.amount -= cost;
      playerMoney.amount += cost;
    } 
    else {
      fromMoney.amount -= cost;
      toMoney.amount += cost;
    }
  }