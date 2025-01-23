// modules/utils/SpriteMapping.js

export const spriteMappings = {
  test: {
    color: 'magenta',
    draw: (tile, x, y, size = 20) => {
      fill('magenta');
      rect(x, y, size, size);
      fill(0);
      textSize(size / 5);
      text('Go to\nSprite\nMapping.js', x, y);
    }
  },

  // ===== Terrain =====
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
      // tiny triangle for variety
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

  // ===== Building / Floors =====
  wall: {
    color: '#ffffff',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'lightgrey' : '#ffffff');
      rect(x, y, size, size);
    }
  },
  bedroom_floor: {
    color: '#93693F',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#785D31');
      rect(x, y, size, size);
    },
  },
  kitchen_floor: {
    color: '#E5E59F',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#E5E59F');
      rect(x, y, size, size);
    },
  },
  livingroom_floor: {
    color: '#F4B183',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#F4B183');
      rect(x, y, size, size);
    },
  },
  bathroom_floor: {
    color: '#ADD8E6',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#ADD8E6');
      rect(x, y, size, size);
    },
  },
  fishproduction_floor: {
    color: '#CABBA8',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#CABBA8');
      rect(x, y, size, size);
    },
  },
  reception_floor: {
    color: '#D8BFD8',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#D8BFD8');
      rect(x, y, size, size);
    },
  },
  staffroom_floor: {
    color: '#C2EABD',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#C2EABD');
      rect(x, y, size, size);
    },
  },

  // ===== Furniture / Doors / Etc. =====
  door: {
    color: '#c18e5a',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#c18e5a');
      rect(x, y, size, size);
      // door handle
      fill('#44342a');
      rect(x + size / 2 - 4, y + size / 4, 8, size / 2);
      fill('yellow');
      ellipse(x + size * 0.8, y + size / 2, 3, 3);
    }
  },
  table: {
    color: '#d2a679',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#d2a679');
      rect(x, y, size, size);
      // table legs
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
      // pillow
      fill('white');
      rect(x + size * 0.1, y + size * 0.1, size * 0.3, size * 0.3);
    }
  },
  cashregister: {
    color: 'slategrey',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'slategrey');
      rect(x, y, size, size);
      fill('black');
      ellipse(x + size * 0.5, y + size * 0.3, size / 5);
    }
  },

  red_carpet: {
    color: 'red',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#E95F30');
      rect(x, y, size, size);
      // If tile.lockedDemand => draw consumer price above, etc.
      // (the hooking logic references this tile type).
    }
  },

  fishingrod: {
    color: 'peru',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'peru');
      rect(x, y, size, size);
      stroke('black');
      noFill();
      arc(x + size * 0.7, y + size * 0.2, size / 2, size / 2, PI / 2, PI);
      noStroke();
    }
  },
  fridge: {
    color: 'aquamarine',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'aquamarine');
      rect(x, y, size, size);
      stroke('#ffffff');
      line(x + size * 0.3, y + size * 0.2, x + size * 0.3, y + size * 0.8);
      line(x + size * 0.7, y + size * 0.2, x + size * 0.7, y + size * 0.8);
      noStroke();
    }
  },
  key: {
    color: 'gold',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'gold');
      rect(x, y, size, size);
      fill('darkgoldenrod');
      rect(x + size * 0.2, y + size * 0.8, size * 0.6, size * 0.2);
    }
  },
  heater: {
    color: 'rosybrown',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'rosybrown');
      rect(x, y, size, size);
      fill('#44342a');
      rect(x + size / 2 - 4, y + size / 2, 8, size / 4);
    }
  },
  icebox: {
    color: 'royalblue',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'royalblue');
      rect(x, y, size, size);
      fill('white');
      rect(x, y, size, size / 8);
    }
  },

  stone_bricks: {
    color: '#ffffff',
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'lightgrey' : '#ffffff');
      rect(x, y, size, size);
    }
  },

  // ===== Decor & Interiors =====
  smallsofa: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#9b7653');
      rect(x, y + size / 4, size, (3 * size) / 4);
      fill('#b58f72');
      rect(x, y, size, size / 4);
    },
  },
  tv: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : 'black');
      rect(x, y, size, size);
      fill('#333');
      rect(x + 3, y + 3, size - 6, size - 6);
      fill('#555');
      rect(x + size / 3, y + size, size / 3, size / 4);
    },
  },
  lamp: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#aaa');
      rect(x + size / 2 - 2, y + size / 2, 4, size / 2);
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
      fill(tile.transparent ? 'grey' : '#8B4513');
      rect(x + size / 4, y + size / 2, size / 2, size / 2);
      fill('green');
      ellipse(x + size / 2, y + size / 2, size / 2, size / 3);
      ellipse(x + size / 2, y + size / 4, size / 3, size / 3);
    },
  },
  sculpture: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#b8b8b8');
      rect(x, y + size * 0.6, size, size * 0.4);
      fill('#dcdcdc');
      ellipse(x + size / 2, y + size / 2, size * 0.6);
      rect(x + size / 2 - 3, y + size / 2 - 6, 6, 12);
    },
  },
  bigsign: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#ddd2a3');
      rect(x, y, size, size);
      stroke('#999');
      line(x + 4, y + size / 3, x + size - 4, y + size / 3);
      line(x + 4, y + size / 2, x + size - 4, y + size / 2);
      noStroke();
    },
  },
  fryer: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#666');
      rect(x, y + size / 4, size, (3 * size) / 4);
      stroke('#888');
      for (let i = 0; i < 3; i++) {
        line(x + 4, y + size / 2 + i * 4, x + size - 4, y + size / 2 + i * 4);
      }
      noStroke();
    },
  },
  crate: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#b5651d');
      rect(x, y, size, size);
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
      fill(tile.transparent ? 'grey' : '#999');
      rect(x, y, size, size);
      fill('#555');
      rect(x + size / 2 - 3, y + size * 0.3, 6, size * 0.4);
      fill('#222');
      ellipse(x + size / 2, y + size * 0.8, size * 0.6, size * 0.3);
    },
  },
  bin: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#696969');
      rect(x + size / 4, y + size / 4, size / 2, (3 * size) / 4);
      fill('#777');
      rect(x + size / 4 - 4, y, size / 2 + 8, size / 4);
    },
  },

  // ===== NEW Items (Stove, specialized cash registers, counters) =====
  stove: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#b56e3f');
      rect(x, y, size, size);
      // Hotplate detail
      fill('black');
      ellipse(x + size / 2, y + size / 2, size * 0.4, size * 0.4);
    },
  },
  fishchips_cash: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#8B8B8B');
      rect(x, y, size, size);
      textSize(size * 0.3);
      text('🍟', x + 2, y + size * 0.6);
    },
  },
  fishstew_cash: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#888888');
      rect(x, y, size, size);
      textSize(size * 0.35);
      text('🍲', x + size * 0.25, y + size * 0.6);
    },
  },
  bread_cash: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#888888');
      rect(x, y, size, size);
      textSize(size * 0.35);
      text('🍞', x + size * 0.3, y + size * 0.6);
    },
  },
  counter: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#92816A');
      rect(x, y, size, size);
      // Top strip
      fill('#c2b097');
      rect(x, y, size, size / 5);
    },
  },

  // ====== Updated stool => dark brown circle ======
  stools: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#4e2b15');
      ellipse(x + size / 2, y + size / 2, size * 0.8, size * 0.8);
    },
  },

  // ===== Additional Staffroom / Bathroom Items =====
  waterdispenser: {
    draw: (tile, x, y, size = 20) => {
      // A simple water cooler shape
      fill(tile.transparent ? 'grey' : '#ccf0f0');
      rect(x + size * 0.3, y, size * 0.4, size); 
      fill('#999');
      rect(x + size * 0.3, y + size * 0.8, size * 0.4, size * 0.2);
    }
  },
  toilet: {
    draw: (tile, x, y, size = 20) => {
      // Very simple toilet shape
      fill(tile.transparent ? 'grey' : '#eeeeee');
      rect(x + size * 0.2, y + size * 0.5, size * 0.6, size * 0.4);
      fill('#cccccc');
      rect(x + size * 0.35, y + size * 0.3, size * 0.3, size * 0.2);
    }
  },
  sink: {
    draw: (tile, x, y, size = 20) => {
      fill(tile.transparent ? 'grey' : '#ffffff');
      rect(x + size * 0.2, y + size * 0.4, size * 0.6, size * 0.4);
      fill('#999999');
      rect(x + size * 0.3, y + size * 0.3, size * 0.2, size * 0.1);
    }
  },
  locker: {
    color: 'dimgray',
    draw: (tile, x, y, size = 20) => {
      // Base rectangle
      fill(tile.transparent ? 'grey' : 'dimgray');
      rect(x, y, size, size);
  
      // Locker door border
      stroke('#666');
      strokeWeight(1);
      noFill();
      rect(x + 1, y + 1, size - 2, size - 2);
  
      // Vent slats (horizontal lines)
      stroke('#888');
      let ventStartY = y + size * 0.25; // start ~1/4 down
      let ventH = size * 0.3;           // total vent region
      let slatCount = 3;
      for (let i = 0; i < slatCount; i++) {
        let sy = ventStartY + (i * (ventH / slatCount));
        line(x + size * 0.2, sy, x + size * 0.8, sy);
      }
  
      // Locker handle
      strokeWeight(2);
      stroke('#bbb');
      let handleX = x + size * 0.8;
      let handleY = y + size * 0.6;
      let handleH = size * 0.15;
      line(handleX, handleY, handleX, handleY + handleH);
  
      // Clean up
      noStroke();
    }
  },

// ===== FARM FLOOR WITH DIRT TEXTURE =====
farm_floor: {
  color: '#5C3B1C', // base dark brown
  draw: (tile, x, y, size = 20) => {
    // 1) Fill the main rectangle
    fill(tile.transparent ? 'grey' : '#5C3B1C');
    rect(x, y, size, size);

    // 2) Draw a subtle texture:
    //    We'll just place a few small circles or dots (slightly darker or lighter).
    //    This uses a hard-coded pattern so it's consistent every frame.
    if (!tile.transparent) {
      push();
      noStroke();
      fill('#4a2f17'); // slightly darker than base

      // We'll scatter a few small "dirt dots"
      // You can tweak these positions & dot sizes as desired
      ellipse(x + size * 0.3, y + size * 0.3, 2, 2);
      ellipse(x + size * 0.7, y + size * 0.4, 1.5, 1.5);
      ellipse(x + size * 0.5, y + size * 0.7, 2, 2);
      ellipse(x + size * 0.2, y + size * 0.8, 1.5, 1.5);
      ellipse(x + size * 0.8, y + size * 0.2, 2, 2);

      pop();
    }
  },
},

loadingbay_floor: {
  color: '#D3D3D3', // choose a color
  draw: (tile, x, y, size = 20) => {
    fill(tile.transparent ? 'grey' : '#D3D3D3');
    rect(x, y, size, size);
    // maybe draw some small icons to suggest a loading area, boxes, or stripes
  }
},

potato_table: {
  draw: (tile, x, y, size = 20) => {
    fill('#a87c4a'); // table color
    rect(x, y, size, size);
    // maybe draw a small 🥔 icon in the center, or a few lumps
    fill('#c8a551');
    ellipse(x + size / 2, y + size / 2, size / 2, size / 4);
  }
},

// ===== SEEDS (CLUSTERS) =====
// We'll define small “offsets” around the center so each seed is 3 or 4 mini-shapes in a cluster.
// The clusterOffsets array is just a small set of positions for the mini-seeds.

potato_seed: {
  draw: (tile, x, y, size = 20) => {
    // fill background (dark brown)
    fill('#5C3B1C');
    rect(x, y, size, size);

    // define a few small offsets around the center for multiple seeds
    const clusterOffsets = [
      { dx: -2, dy:  0 },
      { dx:  1, dy: -1 },
      { dx:  3, dy:  2 },
    ];

    fill('#C19A6B'); // potato-brown
    noStroke();

    // Each offset is a small ellipse ~ 15% of tile size
    clusterOffsets.forEach(offset => {
      ellipse(
        x + size / 2 + offset.dx,
        y + size / 2 + offset.dy,
        size * 0.15,
        size * 0.15
      );
    });
  },
},

corn_seed: {
  draw: (tile, x, y, size = 20) => {
    fill('#5C3B1C'); // background
    rect(x, y, size, size);

    const clusterOffsets = [
      { dx: -1, dy: -2 },
      { dx:  2, dy:  1 },
      { dx: -3, dy:  3 },
    ];

    fill('#FFD700'); // bright corn-yellow
    noStroke();

    clusterOffsets.forEach(offset => {
      ellipse(
        x + size / 2 + offset.dx,
        y + size / 2 + offset.dy,
        size * 0.12,  // a little thinner
        size * 0.18
      );
    });
  },
},

carrot_seed: {
  draw: (tile, x, y, size = 20) => {
    fill('#5C3B1C'); 
    rect(x, y, size, size);

    // Carrot seeds: small pointed shapes in a tight cluster
    const clusterOffsets = [
      { dx: 0,  dy: 0 },
      { dx: 2,  dy: -2 },
      { dx: -2, dy: 2 },
    ];

    fill('#FFA500');
    noStroke();

    clusterOffsets.forEach(offset => {
      // We'll draw tiny triangles for each "seed"
      // each about 10–15% of tile size
      const half = size * 0.07;
      triangle(
        x + size / 2 + offset.dx - half, y + size / 2 + offset.dy + half,
        x + size / 2 + offset.dx + half, y + size / 2 + offset.dy,
        x + size / 2 + offset.dx - half, y + size / 2 + offset.dy - half
      );
    });
  },
},

rice_seed: {
  draw: (tile, x, y, size = 20) => {
    fill('#5C3B1C');
    rect(x, y, size, size);

    // Slightly more seeds in the cluster
    const clusterOffsets = [
      { dx: -2, dy:  0 },
      { dx:  2, dy:  0 },
      { dx:  0, dy:  2 },
      { dx:  0, dy: -2 },
    ];

    fill('#F5F5DC'); // beige/white
    noStroke();

    clusterOffsets.forEach(offset => {
      ellipse(
        x + size / 2 + offset.dx,
        y + size / 2 + offset.dy,
        size * 0.1,
        size * 0.2
      );
    });
  },
  },
  potato_cash: {
    draw: (tile, x, y, size = 20) => {
      // 1) The base rectangle
      fill(tile.transparent ? 'grey' : '#b87333'); // coppery color or anything you like
      rect(x, y, size, size);

      // 2) Possibly draw a small potato icon on top
      fill('white');
      textSize(size * 0.3);
      text('🥔', x + size * 0.3, y + size * 0.65); // tweak position as needed
    }
  },
};
