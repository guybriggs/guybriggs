// modules/systems/ForestInteractionSystem.js
import { isInForest } from '../utils/EnvironmentUtils.js';
import { typewriteLine } from '../logic/BubbleLogic.js';

export class ForestInteractionSystem {
  constructor() {
    this.wasInForest = false;
  }

  update(world, followerEntity) {
    const pos = world.getComponent(followerEntity, 'Position');
    const followerComp = world.getComponent(followerEntity, 'Follower');
    if (!pos || !followerComp) return;

    const currentlyInForest = isInForest(pos);
    if (currentlyInForest && !this.wasInForest) {
      //typewriteLine(followerComp, "*looks around in fear*");
    }
    this.wasInForest = currentlyInForest;
  }
}
