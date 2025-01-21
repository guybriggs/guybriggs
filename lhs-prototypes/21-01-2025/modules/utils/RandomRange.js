// modules/utils/RandomRange.js

export function RandomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  