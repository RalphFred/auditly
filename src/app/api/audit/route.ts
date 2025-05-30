import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runPlaywrightAudit } from '@/lib/audit/playwright';
import { runAIAudit } from '@/lib/audit/ai';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { runLighthouseAudit } from '@/lib/audit/lighthouse';
import { getClientIp } from '@/lib/utils';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import path from 'path';
import fs from 'fs';

// Input validation schema
const auditRequestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
});

export async function POST(request: Request) {
  console.log('=== AUDIT API ROUTE STARTED ===');
  
  try {
    // Get client IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for') || '';
    const ip = forwardedFor.split(',')[0] || 'unknown';

    // Check rate limit
    const rateLimitResult = rateLimit(ip);
    if (!rateLimitResult.success) {
      console.log('Rate limit exceeded for IP:', ip);
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate URL
    let url;
    try {
      const result = auditRequestSchema.parse(body);
      url = result.url;
      console.log('Validated URL:', url);
    } catch (e) {
      console.error('URL validation failed:', e);
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Start the audit process
    const auditResults = await performAudit(url);
    console.log('Final results:', JSON.stringify(auditResults, null, 2));

    return NextResponse.json(auditResults);
  } catch (error) {
    console.error('Error occurred at:', new Date().toISOString());
    
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Non-Error object:', error);
    }

    // Always return a JSON response, even for errors
    return NextResponse.json(
      { 
        error: 'Failed to perform audit',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } finally {
    console.log('=== AUDIT API ROUTE COMPLETED ===');
  }
}

async function performAudit(url: string) {
  try {
    // Run Playwright audit first to get screenshots
    const playwrightResults = await runPlaywrightAudit(url).catch(error => {
      console.error('=== PLAYWRIGHT AUDIT FAILED ===');
      console.error('Error:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        seo: {
          title: null,
          metaDescription: null,
          headings: { h1: [], h2: [], h3: [] },
          images: { total: 0, withoutAlt: 0 },
          links: { total: 0, internal: 0, external: 0 },
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
          },
          schema: {
            hasSchema: false,
            types: [],
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
        },
        performance: {
          loadTime: 0,
          domContentLoaded: 0,
        },
      };
    });

    // If we have screenshots, send them immediately
    if (playwrightResults.status === 'success' && playwrightResults.screenshots) {
      // Create a response with the screenshots
      const initialResponse = {
        status: 'loading',
        screenshots: playwrightResults.screenshots,
        message: 'Screenshots captured, running analysis...'
      };

      // Send the initial response
      const response = new Response(JSON.stringify(initialResponse), {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked'
        }
      });

      // Run other audits in parallel
      const [lighthouseResults, aiResults] = await Promise.all([
        runLighthouseAudit(url).catch(error => {
          console.error('=== LIGHTHOUSE AUDIT FAILED ===');
          console.error('Error:', error);
          return {
            status: 'error',
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            maxPotentialFID: 0,
          };
        }),
        runAIAudit(url, playwrightResults.screenshots).catch(error => {
          console.error('=== AI AUDIT FAILED ===');
          console.error('Error:', error);
          console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
          return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            uxAnalysis: {
              overallScore: 0,
              strengths: [],
              weaknesses: [],
              recommendations: [],
              quickFixes: {
                seo: '',
                performance: '',
                mobile: '',
                content: '',
                accessibility: ''
              }
            },
          };
        }),
      ]);

      // Merge Lighthouse metrics into Playwright results
      if (playwrightResults.status === 'success' && lighthouseResults.status === 'success') {
        playwrightResults.seo.technical.coreWebVitals = {
          lcp: lighthouseResults.largestContentfulPaint / 1000,
          fid: lighthouseResults.maxPotentialFID,
          cls: lighthouseResults.cumulativeLayoutShift,
        };
      }

      // Return the final results
      return {
        url,
        timestamp: new Date().toISOString(),
        playwright: playwrightResults,
        ai: aiResults,
      };
    }

    // If no screenshots, run all audits in parallel
    const [lighthouseResults, aiResults] = await Promise.all([
      runLighthouseAudit(url).catch(error => {
        console.error('=== LIGHTHOUSE AUDIT FAILED ===');
        console.error('Error:', error);
        return {
          status: 'error',
          largestContentfulPaint: 0,
          cumulativeLayoutShift: 0,
          maxPotentialFID: 0,
        };
      }),
      runAIAudit(url).catch(error => {
        console.error('=== AI AUDIT FAILED ===');
        console.error('Error:', error);
        console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
        return {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          uxAnalysis: {
            overallScore: 0,
            strengths: [],
            weaknesses: [],
            recommendations: [],
            quickFixes: {
              seo: '',
              performance: '',
              mobile: '',
              content: '',
              accessibility: ''
            }
          },
        };
      }),
    ]);

    // Merge Lighthouse metrics into Playwright results
    if (playwrightResults.status === 'success' && lighthouseResults.status === 'success') {
      playwrightResults.seo.technical.coreWebVitals = {
        lcp: lighthouseResults.largestContentfulPaint / 1000,
        fid: lighthouseResults.maxPotentialFID,
        cls: lighthouseResults.cumulativeLayoutShift,
      };
    }

    console.log('All audits completed');
    console.log('Playwright results:', JSON.stringify(playwrightResults, null, 2));
    console.log('Lighthouse results:', JSON.stringify(lighthouseResults, null, 2));
    console.log('AI results:', JSON.stringify(aiResults, null, 2));
    
    return {
      url,
      timestamp: new Date().toISOString(),
      playwright: playwrightResults,
      ai: aiResults,
    };
  } catch (error) {
    console.error('=== ERROR IN PERFORM AUDIT ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  } finally {
    console.log('=== PERFORM AUDIT FUNCTION COMPLETED ===');
  }
}

// Add this new route handler for serving screenshots
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return new NextResponse('Filename is required', { status: 400 });
  }

  const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
  const filePath = path.join(screenshotsDir, filename);

  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    const headers = new Headers();
    headers.set('Content-Type', 'image/png');
    headers.set('Cache-Control', 'public, max-age=31536000');
    
    return new NextResponse(fileBuffer, {
      headers,
    });
  } catch (error) {
    console.error('Error serving screenshot:', error);
    return new NextResponse('Screenshot not found', { status: 404 });
  }
} 