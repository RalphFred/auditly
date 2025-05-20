import { Worker } from 'worker_threads';
import path from 'path';

export interface LighthouseAuditResult {
  status: 'success' | 'error';
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  progressiveWebApp: number;
  firstContentfulPaint: number;
  speedIndex: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  firstMeaningfulPaint: number;
  maxPotentialFID: number;
  serverResponseTime: number;
  mainThreadWork: number;
  bootupTime: number;
  networkRequests: number;
  networkRtt: number;
  networkServerLatency: number;
  totalByteWeight: number;
  domSize: number;
  criticalRequestChains: number;
  renderBlockingResources: number;
  unminifiedCss: number;
  unminifiedJavascript: number;
  unusedCssRules: number;
  unusedJavascript: number;
  modernImageFormats: number;
  offscreenImages: number;
  preloadLcpImage: number;
  unloadJavascript: number;
  usesTextCompression: number;
  usesResponsiveImages: number;
  usesRelPreconnect: number;
  usesRelPreload: number;
  usesHttp2: number;
  usesPassiveEventListeners: number;
  configSettings: {
    formFactor: string;
    screenEmulation: {
      mobile: boolean;
      width: number;
      height: number;
      deviceScaleFactor: number;
      disabled: boolean;
    };
    throttling: {
      rttMs: number;
      throughputKbps: number;
      cpuSlowdownMultiplier: number;
    };
  };
  error?: string;
}

export async function runLighthouseAudit(url: string): Promise<LighthouseAuditResult> {
  return new Promise((resolve, reject) => {
    console.log('Starting Lighthouse worker...');
    const worker = new Worker(path.join(process.cwd(), 'src/lib/audit/lighthouse-worker.ts'), {
      workerData: { url }
    });

    worker.on('message', (result: LighthouseAuditResult) => {
      console.log('Received results from Lighthouse worker');
      resolve(result);
    });

    worker.on('error', (error) => {
      console.error('Lighthouse worker error:', error);
      resolve({
        status: 'error',
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0,
        progressiveWebApp: 0,
        firstContentfulPaint: 0,
        speedIndex: 0,
        largestContentfulPaint: 0,
        timeToInteractive: 0,
        totalBlockingTime: 0,
        cumulativeLayoutShift: 0,
        firstMeaningfulPaint: 0,
        maxPotentialFID: 0,
        serverResponseTime: 0,
        mainThreadWork: 0,
        bootupTime: 0,
        networkRequests: 0,
        networkRtt: 0,
        networkServerLatency: 0,
        totalByteWeight: 0,
        domSize: 0,
        criticalRequestChains: 0,
        renderBlockingResources: 0,
        unminifiedCss: 0,
        unminifiedJavascript: 0,
        unusedCssRules: 0,
        unusedJavascript: 0,
        modernImageFormats: 0,
        offscreenImages: 0,
        preloadLcpImage: 0,
        unloadJavascript: 0,
        usesTextCompression: 0,
        usesResponsiveImages: 0,
        usesRelPreconnect: 0,
        usesRelPreload: 0,
        usesHttp2: 0,
        usesPassiveEventListeners: 0,
        configSettings: {
          formFactor: '',
          screenEmulation: {
            mobile: false,
            width: 0,
            height: 0,
            deviceScaleFactor: 0,
            disabled: false
          },
          throttling: {
            rttMs: 0,
            throughputKbps: 0,
            cpuSlowdownMultiplier: 0
          }
        },
        error: error.message
      });
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Lighthouse worker stopped with exit code ${code}`);
      }
    });
  });
} 