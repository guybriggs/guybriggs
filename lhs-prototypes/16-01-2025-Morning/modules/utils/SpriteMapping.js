// modules/utils/SpriteMappings.js

// Provide colors or shapes for each type
export const spriteMappings = {
    wall: {
      color: '#ffffff', // white
      draw: (p5, x, y, size = 20) => {
        p5.fill('#ffffff');
        p5.rect(x, y, size, size);
      }
    },
    floor: {
      color: '#4e2b15', 
      draw: (p5, x, y, size = 20) => {
        // A brownish rectangle
        p5.fill('#4e2b15');
        p5.rect(x, y, size, size);
      }
    },
    door: {
      color: '#c18e5a',
      draw: (p5, x, y, size = 20) => {
        p5.fill('#c18e5a');
        p5.rect(x, y, size, size);
        // Additional handle or detail?
        p5.fill('#44342a');
        p5.rect(x + size/2 - 4, y + size/4, 8, size/2);
      }
    },
    table: {
      color: '#d2a679',
      draw: (p5, x, y, w = 30, h = 30) => {
        p5.fill('#d2a679');
        p5.rect(x, y, w, h);
      }
    },
    bed: {
      color: '#add8e6',
      draw: (p5, x, y, w = 20, h = 30) => {
        p5.fill('#add8e6');
        p5.rect(x, y, w, h);
      }
    }
  };
  