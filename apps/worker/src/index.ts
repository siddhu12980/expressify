import { QUEUE_NAME, redisConnection, type DeploymentJobData, Worker, Job } from "@mini-vercel/queue"
import { executeLocalDeployment } from "./utils/bulder"
import "dotenv/config"

const worker = new Worker(
  QUEUE_NAME,
  async (job: Job<DeploymentJobData>) => {
    await executeLocalDeployment(job.data.deploymentId, job.data.cloneUrl)
  },
  { connection: redisConnection },
)

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`)
})

worker.on("failed", (job, error) => {
  console.log(`Job ${job?.id} failed: ${error.message}`)
})

worker.on("error", (error) => {
  console.error(`Worker error: ${error.message}`)
})

worker.on("closed", () => {
  console.log("Worker closed")
})
