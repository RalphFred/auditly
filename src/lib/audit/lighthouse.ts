import { Worker } from 'worker_threads';
import path from 'path';

interface LighthouseResult {
  status: 'success' | 'error';
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  maxPotentialFID: number;
  error?: string;
}

export async function runLighthouseAudit(url: string): Promise<LighthouseResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(process.cwd(), 'public/workers/lib/audit/lighthouse-worker.js'), {
      workerData: { url }
    });

    worker.on('message', resolve);
    worker.on('error', (error: Error) => {
      console.error('Lighthouse worker error:', error);
      resolve({
        status: 'error',
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        maxPotentialFID: 0,
        error: error.message
      });
    });
  });
} 