// modules/utils/SpriteMapping.js

export const spriteMappings = {
  test: {
    color: 'magenta',
    draw: (tile, x, y, size = 20) => {
      fill('magenta');
      rect(x, y, size, size);
    }
  },
  ocean: {
    color: '#7BD1D1',
    draw: (tile, x, y, size = 20) => {
      fill('#7BD1D1');
      rect(x, y, size, size);
    }
  },
  beach: {
    color: '#DFE3C0',
    draw: (tile, x, y, size = 20) => {
      fill('#DFE3C0');
      rect(x, y, size, size);
    }
  },
  grassland: {
    color: '#C6DA31',
    draw: (tile, x, y, size = 20) => {
      fill('#C6DA31');
      rect(x, y, size, size);
      push();
      fill('#BACA2C');
      let gx = x + size / 2;
      let gy = y + size - 6;
      triangle(gx, gy, gx - 3, gy + 6, gx + 3, gy + 6);
      pop();
    }
  },
  forest: {
    color: '#549342',
    draw: (tile, x, y, size = 20) => {
      fill('#549342');
      rect(x, y, size, size);
    }
  },
  mountain: {
    color: '#ACAD90',
    draw: (tile, x, y, size = 20) => {
      fill('#ACAD90');
      rect(x, y, size, size);
    }
  },
  lake: {
    color: '#7BD1D1',
    draw: (tile, x, y, size = 20) => {
      fill('#7BD1D1');
      rect(x, y, size, size);
    }
  },
  wall: {
    color: '#ffffff',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'lightgrey' : '#ffffff');
      rect(x, y, size, size);
    }
  },
  floor: {
    color: '#4e2b15',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#4e2b15');
      rect(x, y, size, size);
    }
  },
  // --- Furniture Sprites with Enhanced Details ---
  door: {
    color: '#c18e5a',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#c18e5a');
      rect(x, y, size, size);
      // Draw door handle within bounds
      fill('#44342a');
      rect(x + size/2 - 4, y + size/4, 8, size/2);
      fill('yellow');
      ellipse(x + size*0.8, y + size/2, 3, 3);
    }
  },
  table: {
    color: '#d2a679',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#d2a679');
      rect(x, y, size, size);
      // Draw table legs contained within the tile
      stroke('#8b5a2b');
      strokeWeight(2);
      line(x + 3, y + size - 3, x + 3, y + size);
      line(x + size - 3, y + size - 3, x + size - 3, y + size);
      noStroke();
    }
  },
  bed: {
    color: '#add8e6',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#add8e6');
      rect(x, y, size, size);
      // Add pillow detail within bounds
      fill('white');
      rect(x + size*0.1, y + size*0.1, size*0.3, size*0.3);
    }
  },
  cashregister: {
    color: 'slategrey',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'slategrey');
      rect(x, y, size, size);
      // Add button detail centered on the tile
      fill('black');
      ellipse(x + size*0.5, y + size*0.3, size/5);
    }
  },
  fishingrod: {
    color: 'peru',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'peru');
      rect(x, y, size, size);
      // Draw a simple hook on the side, contained within tile
      stroke('black');
      noFill();
      arc(x + size*0.7, y + size*0.2, size/2, size/2, PI/2, PI);
      noStroke();
    }
  },
  fridge: {
    color: 'aquamarine',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'aquamarine');
      rect(x, y, size, size);
      // Draw refrigerator lines inside the tile
      stroke('#ffffff');
      line(x + size*0.3, y + size*0.2, x + size*0.3, y + size*0.8);
      line(x + size*0.7, y + size*0.2, x + size*0.7, y + size*0.8);
      noStroke();
    }
  },
  key: {
    color: 'gold',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'gold');
      rect(x, y, size, size);
      // Add key teeth detail within tile
      fill('darkgoldenrod');
      rect(x + size*0.2, y + size*0.8, size*0.6, size*0.2);
    }
  },
  heater: {
    color: 'rosybrown',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'rosybrown');
      rect(x, y, size, size);
      fill('#44342a');
      rect(x + size/2 - 4, y + size/2, 8, size/4);
    }
  }
};
