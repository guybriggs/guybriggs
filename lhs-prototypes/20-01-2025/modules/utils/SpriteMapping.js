// modules/utils/SpriteMapping.js

export const spriteMappings = {
  test: {
    color: 'magenta',
    draw: (tile, x, y, size = 20) => {
      fill('magenta');
      rect(x, y, size, size);
      fill(0);
      textSize(size/5);
      text('Go to\nSprite\nMapping.js', x, y);
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
  },
  icebox: {
    color: 'royalblue',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'royalblue');
      rect(x, y, size, size);
      fill('white');
      rect(x, y, size, size/8);
    }
  },

  stone_bricks: {
    color: '#ffffff',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'lightgrey' : '#ffffff');
      rect(x, y, size, size);
    }
  },

// --- The new "decor" items with extra detail ---
smallsofa: {
  draw: (tile, x, y, size = 20) => {
    // Sofa color
    fill(tile.transparent ? 'grey' : '#9b7653');
    rect(x, y + size / 4, size, (3 * size) / 4); 
    // seat

    // Sofa back
    fill('#b58f72');
    rect(x, y, size, size / 4); 
  },
},

tv: {
  draw: (tile, x, y, size = 20) => {
    // Outer TV frame
    fill(tile.transparent ? 'grey' : 'black');
    rect(x, y, size, size);

    // Screen
    fill('#333');
    rect(x + 3, y + 3, size - 6, size - 6);

    // Maybe a small stand at the bottom
    fill('#555');
    rect(x + size / 3, y + size, size / 3, size / 4);
  },
},

lamp: {
  draw: (tile, x, y, size = 20) => {
    // Lamp base / stand
    fill(tile.transparent ? 'grey' : '#aaa');
    rect(x + size / 2 - 2, y + size / 2, 4, size / 2);

    // Lamp shade
    fill('yellow');
    triangle(
      x + size / 2 - 8, y + size / 2,
      x + size / 2 + 8, y + size / 2,
      x + size / 2, y
    );
  },
},

pottedplant: {
  draw: (tile, x, y, size = 20) => {
    // Pot
    fill(tile.transparent ? 'grey' : '#8B4513');
    rect(x + size / 4, y + size / 2, size / 2, size / 2);

    // Plant: green leaves
    fill('green');
    ellipse(x + size / 2, y + size / 2, size / 2, size / 3);
    ellipse(x + size / 2, y + size / 4, size / 3, size / 3);
  },
},

sculpture: {
  draw: (tile, x, y, size = 20) => {
    // Pedestal
    fill(tile.transparent ? 'grey' : '#b8b8b8');
    rect(x, y + size * 0.6, size, size * 0.4);

    // Sculpted figure on top
    fill('#dcdcdc');
    ellipse(x + size / 2, y + size / 2, size * 0.6);
    rect(x + size / 2 - 3, y + size / 2 - 6, 6, 12);
  },
},

bigsign: {
  draw: (tile, x, y, size = 20) => {
    // Sign board
    fill(tile.transparent ? 'grey' : '#ddd2a3');
    rect(x, y, size, size);

    // Some lines to mimic writing
    stroke('#999');
    line(x + 4, y + size / 3, x + size - 4, y + size / 3);
    line(x + 4, y + size / 2, x + size - 4, y + size / 2);
    noStroke();
  },
},

fryer: {
  draw: (tile, x, y, size = 20) => {
    // Fryer base
    fill(tile.transparent ? 'grey' : '#666');
    rect(x, y + size / 4, size, (3 * size) / 4);

    // Heating coil or basket lines
    stroke('#888');
    for (let i = 0; i < 3; i++) {
      line(x + 4, y + size / 2 + i * 4, x + size - 4, y + size / 2 + i * 4);
    }
    noStroke();
  },
},

crate: {
  draw: (tile, x, y, size = 20) => {
    // Wooden crate
    fill(tile.transparent ? 'grey' : '#b5651d');
    rect(x, y, size, size);

    // Slats or cross lines
    stroke('#8B4513');
    line(x, y + size / 3, x + size, y + size / 3);
    line(x, y + (2 * size) / 3, x + size, y + (2 * size) / 3);
    line(x + size / 3, y, x + size / 3, y + size);
    line(x + (2 * size) / 3, y, x + (2 * size) / 3, y + size);
    noStroke();
  },
},

coffeemachine: {
  draw: (tile, x, y, size = 20) => {
    // Machine body
    fill(tile.transparent ? 'grey' : '#999');
    rect(x, y, size, size);

    // Spout area
    fill('#555');
    rect(x + size / 2 - 3, y + size * 0.3, 6, size * 0.4);

    // Carafe or pot
    fill('#222');
    ellipse(x + size / 2, y + size * 0.8, size * 0.6, size * 0.3);
  },
},

bin: {
  draw: (tile, x, y, size = 20) => {
    // Bin body
    fill(tile.transparent ? 'grey' : '#696969');
    rect(x + size / 4, y + size / 4, size / 2, (3 * size) / 4);

    // Bin lid
    fill('#777');
    rect(x + size / 4 - 4, y, size / 2 + 8, size / 4);
  },
},
};
