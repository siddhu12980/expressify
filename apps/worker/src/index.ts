import { Job, Worker } from "bullmq"
import { QUEUE_NAME, redisConnection, type DeploymentJobData } from "@mini-vercel/queue"

const worker = new Worker(
  QUEUE_NAME,
  async (job: Job<DeploymentJobData>) => {
    console.log(job.data)
  },
  { connection: redisConnection },
)

worker.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed with result ${result}`)
})

worker.on("failed", (job, error) => {
  console.log(`Job ${job?.id} failed with error ${error}`)
})

worker.on("error", (error) => {
  console.error(`Worker error: ${error}`)
})

worker.on("closed", () => {
  console.log("Worker closed")
})
