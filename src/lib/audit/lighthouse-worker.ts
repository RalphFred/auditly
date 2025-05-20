import { parentPort, workerData } from 'worker_threads';
import lighthouse from 'lighthouse/core/index.js';
import * as chromeLauncher from 'chrome-launcher';
import type { LighthouseAuditResult } from './lighthouse';

interface WorkerData {
  url: string;
}

async function runAudit() {
  let chrome: chromeLauncher.LaunchedChrome | null = null;
  
  try {
    console.log('Launching Chrome for Lighthouse...');
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      logLevel: 'info',
    });

    console.log('Running Lighthouse audit...');
    const options = {
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
      logLevel: 'info',
      output: 'json',
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      },
    };

    const results = await lighthouse(workerData.url, options);

    if (!results || !results.lhr) {
      throw new Error('Lighthouse results are undefined');
    }

    console.log('Processing Lighthouse results...');
    const { categories, audits, configSettings } = results.lhr;

    // Helper function to safely get numeric values
    const getNumericValue = (audit: any, key: string): number => {
      return audit[key]?.numericValue ?? 0;
    };

    // Helper function to safely get category score
    const getCategoryScore = (category: any): number => {
      return Math.round((category?.score ?? 0) * 100);
    };

    // Get detailed metrics
    const metrics = {
      firstContentfulPaint: getNumericValue(audits, 'first-contentful-paint'),
      speedIndex: getNumericValue(audits, 'speed-index'),
      largestContentfulPaint: getNumericValue(audits, 'largest-contentful-paint'),
      timeToInteractive: getNumericValue(audits, 'interactive'),
      totalBlockingTime: getNumericValue(audits, 'total-blocking-time'),
      cumulativeLayoutShift: getNumericValue(audits, 'cumulative-layout-shift'),
      firstMeaningfulPaint: getNumericValue(audits, 'first-meaningful-paint'),
      maxPotentialFID: getNumericValue(audits, 'max-potential-fid'),
      serverResponseTime: getNumericValue(audits, 'server-response-time'),
      mainThreadWork: getNumericValue(audits, 'mainthread-work-breakdown'),
      bootupTime: getNumericValue(audits, 'bootup-time'),
      networkRequests: getNumericValue(audits, 'network-requests'),
      networkRtt: getNumericValue(audits, 'network-rtt'),
      networkServerLatency: getNumericValue(audits, 'server-response-time'),
      totalByteWeight: getNumericValue(audits, 'total-byte-weight'),
      domSize: getNumericValue(audits, 'dom-size'),
      criticalRequestChains: getNumericValue(audits, 'critical-request-chains'),
      renderBlockingResources: getNumericValue(audits, 'render-blocking-resources'),
      unminifiedCss: getNumericValue(audits, 'unminified-css'),
      unminifiedJavascript: getNumericValue(audits, 'unminified-javascript'),
      unusedCssRules: getNumericValue(audits, 'unused-css-rules'),
      unusedJavascript: getNumericValue(audits, 'unused-javascript'),
      modernImageFormats: getNumericValue(audits, 'modern-image-formats'),
      offscreenImages: getNumericValue(audits, 'offscreen-images'),
      preloadLcpImage: getNumericValue(audits, 'preload-lcp-image'),
      unloadJavascript: getNumericValue(audits, 'unload-javascript'),
      usesTextCompression: getNumericValue(audits, 'uses-text-compression'),
      usesResponsiveImages: getNumericValue(audits, 'uses-responsive-images'),
      usesRelPreconnect: getNumericValue(audits, 'uses-rel-preconnect'),
      usesRelPreload: getNumericValue(audits, 'uses-rel-preload'),
      usesHttp2: getNumericValue(audits, 'uses-http2'),
      usesPassiveEventListeners: getNumericValue(audits, 'uses-passive-event-listeners'),
    };

    const result: LighthouseAuditResult = {
      status: 'success',
      performance: getCategoryScore(categories.performance),
      accessibility: getCategoryScore(categories.accessibility),
      bestPractices: getCategoryScore(categories['best-practices']),
      seo: getCategoryScore(categories.seo),
      progressiveWebApp: getCategoryScore(categories.pwa),
      ...metrics,
      configSettings: {
        formFactor: configSettings.formFactor,
        screenEmulation: configSettings.screenEmulation,
        throttling: configSettings.throttling,
      },
    };

    parentPort?.postMessage(result);
  } catch (error) {
    console.error('Lighthouse audit failed:', error);
    const errorResult: LighthouseAuditResult = {
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
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    parentPort?.postMessage(errorResult);
  } finally {
    if (chrome) {
      try {
        console.log('Closing Chrome...');
        await chrome.kill();
      } catch (error) {
        console.error('Error closing Chrome:', error);
      }
    }
  }
}

runAudit(); 