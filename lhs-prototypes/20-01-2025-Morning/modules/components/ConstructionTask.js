export function ConstructionTask(data = {}) {
    return {
      type: data.type || 'wall',
      row: data.row,
      col: data.col,
      startTime: data.startTime || 0,
      constructing: data.constructing || false,
      returning: data.returning || false,
      originX: data.originX || 0,
      originY: data.originY || 0
    };
  }
  