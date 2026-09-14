import { Queue } from "bullmq";
import { QUEUE_NAME, workerConnection } from "./config";

export const queue = new Queue(QUEUE_NAME, {
  connection: workerConnection,
  defaultJobOptions: {
    // This configuration retries failed jobs up to 3 times with an exponential 5-second backoff. Completed jobs are removed from Redis, while failed jobs remain available for debugging.
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});