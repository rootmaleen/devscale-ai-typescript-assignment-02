import { Queue } from "bullmq";
import { QUEUE_NAME, workerConnection } from "./config";

export const queue = new Queue(QUEUE_NAME, {
  connection: workerConnection,
  defaultJobOptions: {
    // Retry failures with backoff and keep failed jobs for debugging.
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});