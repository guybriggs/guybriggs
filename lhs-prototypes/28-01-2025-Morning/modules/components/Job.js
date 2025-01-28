export function JobComponent(jobType, jobData = {}) {
    return { jobType, ...jobData };
  }
  