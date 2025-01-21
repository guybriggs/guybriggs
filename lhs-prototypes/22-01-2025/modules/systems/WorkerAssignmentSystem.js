import { tryCommandeeringWorker } from '../utils/WorkerAssignmentUtils.js';

export class WorkerAssignmentSystem {
  update(world) {
    const assignmentQueue = world.placedBuildingsForAssignmentQueue;
    if (!assignmentQueue || assignmentQueue.length === 0) {
      return;
    }

    // Copy tasks to avoid modifying the array during iteration
    const pendingTasks = [...assignmentQueue];

    for (let task of pendingTasks) {
      const worker = tryCommandeeringWorker(world, task.type, task.row, task.col);
      if (worker) {
        const index = assignmentQueue.indexOf(task);
        if (index !== -1) {
          assignmentQueue.splice(index, 1);
        }
      }
      // If no worker is found, leave the task for future assignment
    }
  }
}