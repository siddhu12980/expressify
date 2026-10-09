import { Queue,Job } from "bullmq"
import type { ConnectionOptions } from "bullmq"

export const QUEUE_NAME = "deployment-queue"
export const JOB_NAME = "deployment-job"

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
}

export type DeploymentJobData = {
  deploymentId: string
  cloneUrl: string
}

export { Queue } from "bullmq"
export { Worker } from "bullmq"
export {Job } from "bullmq"



export const deploymentQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
})
