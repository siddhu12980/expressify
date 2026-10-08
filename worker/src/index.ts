import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';

type DeploymentJobData = {
  projectId: string;
  userId: string;
}

const connection = new IORedis({ maxRetriesPerRequest: null });

const worker = new Worker(
  'deployment-queue',
  async (job: Job<DeploymentJobData>) => {
    console.log(job.data);
  },
  { connection },
);





worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result ${result}`);
});

worker.on('failed', (job, error) => {
  console.log(`Job ${job?.id} failed with error ${error}`);
});

worker.on('error', (error) => {
  console.error(`Worker error: ${error}`);
});

worker.on('closed', () => {
  console.log('Worker closed');
});

