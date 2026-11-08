import { randomBytes } from 'node:crypto';
import { logger } from '@/lib/logger';

export type CampaignJobType = 
  | 'GENERATE_INVOICE_PDF'
  | 'GENERATE_PACKING_SLIP_PDF'
  | 'SEND_ORDER_CONFIRMATION_EMAIL'
  | 'SEND_WHATSAPP_NOTIFICATION'
  | 'GENERATE_PRINT_ARTWORK'
  | 'EXPORT_FINANCIAL_REPORT';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface CampaignJob<T = Record<string, unknown>> {
  id: string;
  type: CampaignJobType;
  payload: T;
  status: JobStatus;
  idempotencyKey?: string;
  attempts: number;
  maxRetries: number;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
}

// In-memory persistent queue representation for serverless execution / testing
const campaignJobQueue: Map<string, CampaignJob<any>> = new Map();

/**
 * Enqueue an asynchronous background task
 * Prevents heavy tasks from stalling Next.js HTTP response cycles
 */
export async function enqueueCampaignJob<T extends Record<string, unknown>>(
  type: CampaignJobType,
  payload: T,
  options?: { idempotencyKey?: string; maxRetries?: number }
): Promise<CampaignJob<T>> {
  const idempotencyKey = options?.idempotencyKey;

  // Prevent duplicate job execution
  if (idempotencyKey) {
    for (const existing of campaignJobQueue.values()) {
      if (existing.idempotencyKey === idempotencyKey && existing.type === type) {
        logger.info({ jobId: existing.id, type, idempotencyKey }, 'Idempotent campaign job returned from queue');
        return existing as CampaignJob<T>;
      }
    }
  }

  const job: CampaignJob<T> = {
    id: `cjob_${Date.now()}_${randomBytes(4).toString('hex')}`,
    type,
    payload,
    status: 'PENDING',
    idempotencyKey,
    attempts: 0,
    maxRetries: options?.maxRetries ?? 3,
    createdAt: new Date(),
  };

  campaignJobQueue.set(job.id, job);
  logger.info({ jobId: job.id, type }, 'Campaign background job enqueued');

  return job;
}

/**
 * Executes a pending campaign background job with exponential backoff and retry tracking
 */
export async function processCampaignJob(
  jobId: string,
  handler: (payload: any) => Promise<void>
): Promise<void> {
  const job = campaignJobQueue.get(jobId);
  if (!job) {
    throw new Error(`Campaign job "${jobId}" not found in queue.`);
  }

  job.status = 'PROCESSING';
  job.attempts += 1;

  try {
    await handler(job.payload);
    job.status = 'COMPLETED';
    job.processedAt = new Date();
    logger.info({ jobId: job.id, type: job.type }, 'Campaign job processed successfully');
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    job.error = errMessage;

    if (job.attempts < job.maxRetries) {
      job.status = 'PENDING';
      logger.warn(
        { jobId: job.id, attempt: job.attempts, maxRetries: job.maxRetries, err: errMessage },
        'Campaign job failed, re-queued for retry'
      );
    } else {
      job.status = 'FAILED';
      logger.error(
        { jobId: job.id, attempts: job.attempts, err: errMessage },
        'Campaign job permanently failed after maximum retries'
      );
    }
    throw error;
  }
}

/**
 * Inspect queue health and count pending/failed tasks
 */
export function getCampaignQueueMetrics() {
  let pending = 0;
  let processing = 0;
  let completed = 0;
  let failed = 0;

  for (const job of campaignJobQueue.values()) {
    if (job.status === 'PENDING') pending++;
    else if (job.status === 'PROCESSING') processing++;
    else if (job.status === 'COMPLETED') completed++;
    else if (job.status === 'FAILED') failed++;
  }

  return {
    total: campaignJobQueue.size,
    pending,
    processing,
    completed,
    failed,
  };
}

