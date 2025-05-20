import { chromium } from 'playwright';

export interface PlaywrightAuditResult {
  status: 'success' | 'error';
  seo: {
    title: string | null;
    metaDescription: string | null;
    headings: {
      h1: string[];
      h2: string[];
      h3: string[];
    };
    images: {
      total: number;
      withoutAlt: number;
      oversized: number;
      unoptimized: number;
      lazyLoaded: number;
    };
    links: {
      total: number;
      internal: number;
      external: number;
      broken: number;
      noFollow: number;
    };
    meta: {
      viewport: string | null;
      robots: string | null;
      canonical: string | null;
      ogTags: {
        title: string | null;
        description: string | null;
        image: string | null;
        url: string | null;
      };
      twitterTags: {
        card: string | null;
        title: string | null;
        description: string | null;
        image: string | null;
      };
    };
    schema: {
      hasSchema: boolean;
      types: string[];
      valid: boolean;
      errors: string[];
    };
    technical: {
      hasSsl: boolean;
      hasSitemap: boolean;
      hasRobotsTxt: boolean;
      mobileFriendly: boolean;
      coreWebVitals: {
        lcp: number;
        fid: number;
        cls: number;
      };
      pageSpeed: {
        loadTime: number;
        timeToFirstByte: number;
        domContentLoaded: number;
      };
    };
    content: {
      wordCount: number;
      keywordDensity: Record<string, number>;
      readabilityScore: number;
      contentToCodeRatio: number;
      hasVideo: boolean;
      hasAudio: boolean;
    };
    social: {
      hasFacebookPixel: boolean;
      hasGoogleAnalytics: boolean;
      hasTwitterPixel: boolean;
    };
  };
  performance: {
    loadTime: number;
    domContentLoaded: number;
  };
  error?: string;
}

export async function runPlaywrightAudit(url: string): Promise<PlaywrightAuditResult> {
  let browser = null;
  let context = null;
  let page = null;

  try {
    console.log('Launching Playwright browser...');
    browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('Creating new browser context...');
    context = await browser.newContext();
    
    console.log('Creating new page...');
    page = await context.newPage();

    console.log('Navigating to URL:', url);
    const startTime = Date.now();
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 // 30 second timeout
    });
    const loadTime = Date.now() - startTime;
    console.log('Page loaded in', loadTime, 'ms');

    // Get SEO information
    console.log('Gathering SEO information...');
    const title = await page.title();
    const metaDescription = await page.$eval(
      'meta[name="description"]',
      (el) => el.getAttribute('content')
    ).catch(() => null);

    // Get headings
    console.log('Gathering headings...');
    const headings = {
      h1: await page.$$eval('h1', (els) => els.map((el) => el.textContent?.trim() || '')),
      h2: await page.$$eval('h2', (els) => els.map((el) => el.textContent?.trim() || '')),
      h3: await page.$$eval('h3', (els) => els.map((el) => el.textContent?.trim() || '')),
    };

    // Get images with enhanced analysis
    console.log('Gathering image information...');
    const images = await page.$$eval('img', (imgs) => {
      const total = imgs.length;
      const withoutAlt = imgs.filter((img) => !img.hasAttribute('alt')).length;
      const oversized = imgs.filter((img) => {
        const naturalWidth = img.naturalWidth;
        const displayWidth = img.width;
        return naturalWidth > displayWidth * 2;
      }).length;
      const unoptimized = imgs.filter((img) => {
        const src = img.getAttribute('src') || '';
        return !src.includes('.webp') && !src.includes('.avif');
      }).length;
      const lazyLoaded = imgs.filter((img) => img.hasAttribute('loading') && img.getAttribute('loading') === 'lazy').length;
      return {
        total,
        withoutAlt,
        oversized,
        unoptimized,
        lazyLoaded,
      };
    });

    // Get links with enhanced analysis
    console.log('Gathering link information...');
    const links = await page.$$eval('a', (links) => {
      const total = links.length;
      const internal = links.filter((link) => {
        const href = link.getAttribute('href');
        return href && !href.startsWith('http');
      }).length;
      const noFollow = links.filter((link) => link.getAttribute('rel')?.includes('nofollow')).length;
      return {
        total,
        internal,
        external: total - internal,
        broken: 0, // Will be checked separately
        noFollow,
      };
    });

    // Get meta tags with enhanced social media support
    console.log('Gathering meta tags...');
    const meta = {
      viewport: await page.$eval('meta[name="viewport"]', (el) => el.getAttribute('content')).catch(() => null),
      robots: await page.$eval('meta[name="robots"]', (el) => el.getAttribute('content')).catch(() => null),
      canonical: await page.$eval('link[rel="canonical"]', (el) => el.getAttribute('href')).catch(() => null),
      ogTags: {
        title: await page.$eval('meta[property="og:title"]', (el) => el.getAttribute('content')).catch(() => null),
        description: await page.$eval('meta[property="og:description"]', (el) => el.getAttribute('content')).catch(() => null),
        image: await page.$eval('meta[property="og:image"]', (el) => el.getAttribute('content')).catch(() => null),
        url: await page.$eval('meta[property="og:url"]', (el) => el.getAttribute('content')).catch(() => null),
      },
      twitterTags: {
        card: await page.$eval('meta[name="twitter:card"]', (el) => el.getAttribute('content')).catch(() => null),
        title: await page.$eval('meta[name="twitter:title"]', (el) => el.getAttribute('content')).catch(() => null),
        description: await page.$eval('meta[name="twitter:description"]', (el) => el.getAttribute('content')).catch(() => null),
        image: await page.$eval('meta[name="twitter:image"]', (el) => el.getAttribute('content')).catch(() => null),
      },
    };

    // Get schema markup with validation
    console.log('Gathering schema markup...');
    const schema = await page.$$eval('script[type="application/ld+json"]', (scripts) => {
      const types: string[] = [];
      const errors: string[] = [];
      let valid = true;

      scripts.forEach((script) => {
        try {
          const data = JSON.parse(script.textContent || '');
          if (data['@type']) {
            types.push(data['@type']);
          }
          // Basic validation
          if (!data['@context'] || !data['@type']) {
            valid = false;
            errors.push('Missing required schema properties');
          }
        } catch (e) {
          valid = false;
          errors.push('Invalid JSON in schema markup');
        }
      });

      return {
        hasSchema: types.length > 0,
        types,
        valid,
        errors,
      };
    }).catch(() => ({ hasSchema: false, types: [], valid: false, errors: ['Failed to parse schema markup'] }));

    // Get technical SEO information
    console.log('Gathering technical SEO information...');
    const technical = {
      hasSsl: url.startsWith('https://'),
      hasSitemap: false, // Will be checked separately
      hasRobotsTxt: false, // Will be checked separately
      mobileFriendly: await page.$eval('meta[name="viewport"]', () => true).catch(() => false),
      coreWebVitals: {
        lcp: 0, // Will be populated by Lighthouse
        fid: 0, // Will be populated by Lighthouse
        cls: 0, // Will be populated by Lighthouse
      },
      pageSpeed: {
        loadTime,
        timeToFirstByte: 0, // Will be populated by Lighthouse
        domContentLoaded: await page.evaluate(() => performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart),
      },
    };

    // Get content analysis
    console.log('Analyzing content...');
    const content = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const words = bodyText.split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      
      // Calculate keyword density
      const keywordDensity: Record<string, number> = {};
      words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanWord.length > 3) {
          keywordDensity[cleanWord] = (keywordDensity[cleanWord] || 0) + 1;
        }
      });

      // Calculate readability score (simplified Flesch-Kincaid)
      const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgWordsPerSentence = wordCount / sentences.length;
      const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence * 2)));

      // Calculate content to code ratio
      const htmlLength = document.documentElement.outerHTML.length;
      const contentToCodeRatio = (bodyText.length / htmlLength) * 100;

      return {
        wordCount,
        keywordDensity,
        readabilityScore,
        contentToCodeRatio,
        hasVideo: document.querySelector('video') !== null,
        hasAudio: document.querySelector('audio') !== null,
      };
    });

    // Check for analytics and tracking
    console.log('Checking for analytics and tracking...');
    const social = {
      hasFacebookPixel: await page.evaluate(() => !!document.querySelector('script[src*="facebook.com/tr"]')),
      hasGoogleAnalytics: await page.evaluate(() => !!document.querySelector('script[src*="google-analytics.com"]')),
      hasTwitterPixel: await page.evaluate(() => !!document.querySelector('script[src*="static.ads-twitter.com"]')),
    };

    console.log('Playwright audit completed successfully');
    return {
      status: 'success',
      seo: {
        title,
        metaDescription,
        headings,
        images,
        links,
        meta,
        schema,
        technical,
        content,
        social,
      },
      performance: {
        loadTime,
        domContentLoaded: await page.evaluate(() => performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart),
      },
    };
  } catch (error) {
    console.error('Playwright audit failed:', error);
    return {
      status: 'error',
      seo: {
        title: null,
        metaDescription: null,
        headings: { h1: [], h2: [], h3: [] },
        images: { total: 0, withoutAlt: 0, oversized: 0, unoptimized: 0, lazyLoaded: 0 },
        links: { total: 0, internal: 0, external: 0, broken: 0, noFollow: 0 },
        meta: {
          viewport: null,
          robots: null,
          canonical: null,
          ogTags: {
            title: null,
            description: null,
            image: null,
            url: null,
          },
          twitterTags: {
            card: null,
            title: null,
            description: null,
            image: null,
          },
        },
        schema: {
          hasSchema: false,
          types: [],
          valid: false,
          errors: [],
        },
        technical: {
          hasSsl: false,
          hasSitemap: false,
          hasRobotsTxt: false,
          mobileFriendly: false,
          coreWebVitals: {
            lcp: 0,
            fid: 0,
            cls: 0,
          },
          pageSpeed: {
            loadTime: 0,
            timeToFirstByte: 0,
            domContentLoaded: 0,
          },
        },
        content: {
          wordCount: 0,
          keywordDensity: {},
          readabilityScore: 0,
          contentToCodeRatio: 0,
          hasVideo: false,
          hasAudio: false,
        },
        social: {
          hasFacebookPixel: false,
          hasGoogleAnalytics: false,
          hasTwitterPixel: false,
        },
      },
      performance: {
        loadTime: 0,
        domContentLoaded: 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  } finally {
    try {
      if (page) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
    } catch (error) {
      console.error('Error closing Playwright resources:', error);
    }
  }
} 