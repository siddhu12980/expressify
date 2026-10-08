import { Queue } from "bullmq";

/** Backend producer only; workers live in the `worker` package. */
export const deploymentQueue = new Queue("deployment-queue", {
  connection: { host: "localhost", port: 6379 },
});
