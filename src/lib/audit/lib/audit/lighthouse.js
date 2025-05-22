import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
export async function runLighthouseAudit(url) {
    return new Promise((resolve, reject) => {
        try {
            // Get the project root directory
            const projectRoot = process.cwd();
            // Construct the path to the compiled worker file
            const workerPath = path.join(projectRoot, 'src', 'lib', 'audit', 'lighthouse-worker.js');
            // Verify the worker file exists
            if (!fs.existsSync(workerPath)) {
                throw new Error(`Lighthouse worker file not found at: ${workerPath}\n` +
                    `Please ensure the TypeScript worker file is compiled to JavaScript.`);
            }
            const worker = new Worker(workerPath, {
                workerData: { url }
            });
            // Set a timeout for the worker
            const timeout = setTimeout(() => {
                worker.terminate();
                reject(new Error('Lighthouse audit timed out after 30 seconds'));
            }, 30000);
            worker.on('message', (result) => {
                clearTimeout(timeout);
                if (result.status === 'error') {
                    reject(new Error(result.error || 'Lighthouse audit failed'));
                }
                else {
                    resolve(result);
                }
            });
            worker.on('error', (error) => {
                clearTimeout(timeout);
                reject(new Error(`Worker error: ${error.message}`));
            });
            worker.on('exit', (code) => {
                clearTimeout(timeout);
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        }
        catch (error) {
            reject(new Error(`Failed to start Lighthouse worker: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
                `Project root: ${process.cwd()}\n` +
                `Node version: ${process.version}`));
        }
    });
}
