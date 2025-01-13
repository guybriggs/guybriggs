// modules/systems/WindArrowSystem.js
import { tileMap, mapCols, mapRows, tileSize } from '../tile/TileMap.js';

export class WindArrowSystem {
  constructor() {
    this.arrows = [];
    this.spawnRate = 1500;
    this.lastSpawnTime = 0;

    // Arrow behavior
    this.arrowLifetime = 3000;
    this.fadeDuration = 500;
    this.speed = 0.5;        // magnitude of velocity
    this.seAngle = Math.PI / 4; // 45° => southeast

    // Gust settings
    this.minArrows = 5;
    this.maxArrows = 12;

    // Wobble
    this.wobbleDuration = 500; // ms
  }

  update(world, deltaTime) {
    const now = millis();
    // Spawn gust if enough time has passed
    if (now - this.lastSpawnTime > this.spawnRate) {
      this.spawnWindGust();
      this.lastSpawnTime = now;
    }

    // Update existing arrows
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arrow = this.arrows[i];
      arrow.age += deltaTime;

      // Move southeast
      arrow.x += arrow.vx * (deltaTime / 16.7);
      arrow.y += arrow.vy * (deltaTime / 16.7);

      // Check tile for forest boundary
      const col = Math.floor(arrow.x / tileSize);
      const row = Math.floor(arrow.y / tileSize);
      if (!this.isForestTile(row, col)) {
        this.fadeOut(arrow);
      } else {
        // Tree wobble if passing over a tree
        const tile = tileMap[row][col];
        if (tile.hasTree) {
          tile.wobbleEndTime = millis() + this.wobbleDuration;
        }
      }

      // Update alpha
      arrow.alpha = this.computeAlpha(arrow);

      // Remove arrow if it’s fully faded or past lifetime
      if (arrow.alpha <= 0 || arrow.age >= arrow.lifetime) {
        this.arrows.splice(i, 1);
      }
    }
  }

  // Spawns a bow-shaped “wall” of 5–12 arrows
  spawnWindGust() {
    // Collect all forest cells
    const forestCells = [];
    for (let r = 0; r < mapRows; r++) {
      for (let c = 0; c < mapCols; c++) {
        if (this.isForestTile(r, c)) {
          forestCells.push({ r, c });
        }
      }
    }
    if (!forestCells.length) return;

    // Pick a random forest cell as center
    const cell = forestCells[Math.floor(Math.random() * forestCells.length)];
    const centerX = cell.c * tileSize + tileSize / 2;
    const centerY = cell.r * tileSize + tileSize / 2;

    // Number of arrows in the gust
    const count = Math.floor(Math.random() * (this.maxArrows - this.minArrows + 1)) + this.minArrows;

    // We'll define a perpendicular angle to seAngle
    const perpAngle = this.seAngle + Math.PI / 2;
    const distanceBetween = 15; // spacing left-right
    const bowAmplitude = 30;    // how far forward the center arrow is

    for (let i = 0; i < count; i++) {
      // offsetIndex: negative for left side, positive for right side
      const offsetIndex = i - (count - 1) / 2;
      // fraction f in [-1..1], so middle arrow is f=0
      const f = offsetIndex / ((count - 1) / 2 || 1);

      // Perpendicular offset so arrows form a horizontal line
      const xPerp = distanceBetween * offsetIndex * Math.cos(perpAngle);
      const yPerp = distanceBetween * offsetIndex * Math.sin(perpAngle);

      // Bow offset: a parabolic shape so the center arrow is furthest SE
      // e.g. middle arrow gets +bowAmplitude, edges get less
      const forwardOffset = bowAmplitude * (1 - f * f);

      // Convert that offset into x,y along the southeast angle
      const xBow = forwardOffset * Math.cos(this.seAngle);
      const yBow = forwardOffset * Math.sin(this.seAngle);

      // Combine offsets for final position
      const startX = centerX + xPerp + xBow;
      const startY = centerY + yPerp + yBow;

      this.arrows.push({
        x: startX,
        y: startY,
        vx: this.speed * Math.cos(this.seAngle),
        vy: this.speed * Math.sin(this.seAngle),
        rotation: this.seAngle,
        age: 0,
        alpha: 0,
        lifetime: this.arrowLifetime,
        fadeMode: 'in'
      });
    }
  }

  // Checks if the tile at (row, col) is forest
  isForestTile(r, c) {
    return (
      r >= 0 && r < mapRows &&
      c >= 0 && c < mapCols &&
      tileMap[r][c].type === 'forest'
    );
  }

  // Fade the arrow out
  fadeOut(arrow) {
    if (arrow.fadeMode !== 'out') {
      arrow.fadeMode = 'out';
      arrow.lifetime = arrow.age + this.fadeDuration;
    }
  }

  // Compute alpha for fade in/out
  computeAlpha(arrow) {
    if (arrow.fadeMode === 'in') {
      if (arrow.age < this.fadeDuration) {
        return map(arrow.age, 0, this.fadeDuration, 0, 255);
      } else {
        return 255;
      }
    } else {
      // Fade out
      const elapsed = arrow.age - (arrow.lifetime - this.fadeDuration);
      return map(elapsed, 0, this.fadeDuration, 255, 0);
    }
  }
}
