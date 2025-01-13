// modules/components/Behavior.js
export const BehaviorTypes = {
  WANDER: 'wander',
  GROUP_WANDER: 'group_wander',
  PATH_FOLLOW: 'path_follow',
  SIT: 'sit', // New behavior for sitting agents
};

export function BehaviorComponent(type, data = {}) {
  return {
    type,
    data,
  };
}
