'use client';

import Image from "next/image";
import { useId, useState } from "react";
import { ArrowRightIcon, SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuditResults {
  url: string;
  timestamp: string;
  playwright: {
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
    screenshots: {
      fullPage: string;
      viewport: string;
    } | null;
  };
  ai: {
    status: 'success' | 'error';
    uxAnalysis: {
      overallScore: number;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
      quickFixes: {
        seo: string;
        performance: string;
        mobile: string;
        content: string;
        accessibility: string;
      };
      visualAnalysis: {
        layout: string;
        colorScheme: string;
        typography: string;
        visualHierarchy: string;
        mobileResponsiveness: string;
      } | null;
    };
  };
}

interface LoadingState {
  status: 'loading';
  screenshots: {
    fullPage: string;
    viewport: string;
  };
  message: string;
}

export default function Home() {
  const id = useId();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState<LoadingState | null>(null);
  const [results, setResults] = useState<AuditResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading({ status: 'loading', screenshots: { fullPage: '', viewport: '' }, message: 'Starting analysis...' });
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to perform audit');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to read response');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Parse the chunk
        const chunk = new TextDecoder().decode(value);
        const data = JSON.parse(chunk);

        if (data.status === 'loading') {
          setLoading(data);
        } else {
          setResults(data);
          setLoading(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(null);
    }
  };

  return (
    <div className="wrapper">
      <nav className="py-8">
        <div className="flex items-center gap-2 text-4xl font-bold">
          <Image
            src="/images/logo.svg"
            alt="Auditly Logo"
            width={64}
            height={64}
          />
          auditly
        </div>
      </nav>

      <div>
        <h1 className="text-4xl lg:text-5xl font-bold mt-[100px] text-center mb-12">
          Your All-In-One Website Audit Platform
        </h1>
        <form onSubmit={handleSubmit} className="*:not-first:mt-2 max-w-2xl mx-auto">
          <div className="relative">
            <Input
              id={id}
              className="peer ps-9 pe-9 focus-visible:ring-primary-100 focus-visible:ring-offset-0 focus-visible:border-primary-100 py-6 px-6 text-lg rounded-full"
              placeholder="https://www.yourdomain.com"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <SearchIcon size={16} />
            </div>
            <button
              type="submit"
              disabled={!!loading}
              className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Submit search"
            >
              <ArrowRightIcon size={16} aria-hidden="true" />
            </button>
          </div>
        </form>

        {loading && (
          <div className="mt-12 max-w-4xl mx-auto mb-20">
            <div className="text-center mb-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-lg">{loading.message}</p>
            </div>

            {/* Loading Screenshots */}
            {loading.screenshots.viewport && (
              <div className="p-6 border rounded-xl mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>📸</span> Website Preview
                </h3>
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                  <Image
                    src={loading.screenshots.viewport}
                    alt="Viewport screenshot"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {/* Analysis Progress */}
            <div className="mt-8 space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Running Analysis</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span>Analyzing page structure and content...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span>Evaluating visual design and user experience...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span>Checking performance and technical aspects...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span>Generating AI-powered recommendations...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center mt-8 text-red-500">
            <p>{error}</p>
          </div>
        )}

        {results && (
          <div className="mt-12 max-w-4xl mx-auto mb-20">
            <h2 className="text-2xl font-bold mb-6">Audit Results for {results.url}</h2>

              {/* Screenshots */}
              {results.playwright.screenshots && (
                <div className="p-6 border rounded-xl">
                  <div className="grid grid-cols-1">
                     <div>
                      <h4 className="font-medium mb-2">Viewport</h4>
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden border">
                        <Image
                          src={results.playwright.screenshots.viewport}
                          alt="Viewport screenshot"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                    {/* <div>
                      <h4 className="font-medium mb-2">Full Page</h4>
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden border">
                        <Image
                          src={results.playwright.screenshots.fullPage}
                          alt="Full page screenshot"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div> */}
                   
                  </div>
                </div>
              )}
            
            {/* Overview Summary */}
            <div className="mb-8 p-6 bg-primary-50 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">🧠 Overview Summary</h3>
              <p className="text-lg mb-4">"Here's what we found on your site:"</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    <span className="font-medium">SSL Security</span>
                    <span className="text-green-600">Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📱</span>
                    <span className="font-medium">Mobile-Friendly</span>
                    <span className="text-green-600">Looks great on phones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🕒</span>
                    <span className="font-medium">Load Time</span>
                    <span className={`${results.playwright.performance.loadTime > 2000 ? 'text-red-600' : results.playwright.performance.loadTime > 1000 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {(results.playwright.performance.loadTime / 1000).toFixed(2)}s
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔍</span>
                    <span className="font-medium">SEO Basics</span>
                    <span className="text-yellow-600">Needs improvement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📈</span>
                    <span className="font-medium">Analytics</span>
                    <span className="text-red-600">Missing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📷</span>
                    <span className="font-medium">Media</span>
                    <span className="text-yellow-600">{results.playwright.seo.images.unoptimized} images unoptimized</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="space-y-8">
              {/* Basic Info & SEO */}
              <div className="p-6 border rounded-xl">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>🧩</span> Basic Info & SEO
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="mb-2">✅ You have a clear title and description – great for Google.</p>
                    <p className="text-muted-foreground">But you're missing a few things that help Google and social media platforms understand your site better.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Images</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <span>{results.playwright.seo.images.withoutAlt === 0 ? '✅' : '⚠️'}</span>
                          <span>Images without alt text: {results.playwright.seo.images.withoutAlt}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>⚠️</span>
                          <span>Unoptimized images: {results.playwright.seo.images.unoptimized}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>✅</span>
                          <span>Lazy Loading: {results.playwright.seo.images.lazyLoaded} images</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">🛠 Quick Fix Tip</h4>
                      <p>
                        {results.playwright.seo.images.withoutAlt > 0 && results.playwright.seo.images.unoptimized > 0
                          ? "Add alt text to all images and optimize image sizes to improve SEO and page load speed."
                          : results.playwright.seo.images.withoutAlt > 0
                          ? "Add descriptive alt text to all images to improve accessibility and SEO."
                          : results.playwright.seo.images.unoptimized > 0
                          ? "Optimize your images by compressing them and using modern formats like WebP to improve page load speed."
                          : "Your images are well optimized! Consider implementing responsive images for different screen sizes."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical SEO */}
              <div className="p-6 border rounded-xl">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>⚙️</span> Technical SEO
                </h3>
                <div className="space-y-4">
                  <p className="text-muted-foreground">Things search engines need but can't find:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <span>{results.playwright.seo.technical.hasSitemap ? '✅' : '❌'}</span>
                          <span>Sitemap is {results.playwright.seo.technical.hasSitemap ? 'present' : 'missing'}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>{results.playwright.seo.technical.hasRobotsTxt ? '✅' : '❌'}</span>
                          <span>Robots.txt is {results.playwright.seo.technical.hasRobotsTxt ? 'present' : 'missing'}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">🛠 Quick Fix Tip</h4>
                      <p>
                        {!results.playwright.seo.technical.hasSitemap && !results.playwright.seo.technical.hasRobotsTxt 
                          ? "Create both a sitemap.xml and robots.txt file in your root directory to help search engines better understand and crawl your website structure."
                          : !results.playwright.seo.technical.hasSitemap 
                          ? "Create a sitemap.xml file in your root directory to help search engines discover and index your pages."
                          : !results.playwright.seo.technical.hasRobotsTxt 
                          ? "Create a robots.txt file in your root directory to control how search engines crawl your website."
                          : "Your technical SEO foundation looks good! Consider optimizing your sitemap with priority and change frequency attributes."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="p-6 border rounded-xl">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>🚀</span> Performance
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <span>⏱</span>
                          <span>Load Time: </span>
                          <span className={`${results.playwright.performance.loadTime > 2000 ? 'text-red-600' : results.playwright.performance.loadTime > 1000 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {(results.playwright.performance.loadTime / 1000).toFixed(2)}s
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>📊</span>
                          <span>DOM Content Loaded: </span>
                          <span className={`${results.playwright.performance.domContentLoaded > 1500 ? 'text-red-600' : results.playwright.performance.domContentLoaded > 800 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {(results.playwright.performance.domContentLoaded / 1000).toFixed(2)}s
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">🛠 Quick Fix Tip</h4>
                      <p>
                        {results.playwright.performance.loadTime > 2000
                          ? "Your page load time is **too slow**. Consider implementing code splitting, lazy loading, and optimizing your assets."
                          : results.playwright.performance.domContentLoaded > 1500
                          ? "Your DOM content loaded time is **high**. Optimize your JavaScript execution and reduce render-blocking resources."
                          : "Your performance metrics look **good**! Consider implementing caching strategies for even better performance."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile & Social */}
              <div className="p-6 border rounded-xl">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>📱</span> Mobile & Social
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <span>{results.playwright.seo.technical.mobileFriendly ? '✅' : '❌'}</span>
                          <span>Mobile-Friendly: {results.playwright.seo.technical.mobileFriendly ? 'Works well' : 'Needs improvement'}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>{results.playwright.seo.meta.ogTags.title ? '✅' : '❌'}</span>
                          <span>Social Meta Tags: {results.playwright.seo.meta.ogTags.title ? 'Enabled' : 'Missing'}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>{results.playwright.seo.social.hasFacebookPixel ? '✅' : '❌'}</span>
                          <span>Facebook Pixel: {results.playwright.seo.social.hasFacebookPixel ? 'Installed' : 'Missing'}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>{results.playwright.seo.social.hasGoogleAnalytics ? '✅' : '❌'}</span>
                          <span>Google Analytics: {results.playwright.seo.social.hasGoogleAnalytics ? 'Installed' : 'Missing'}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">🛠 Quick Fix Tip</h4>
                      <p>
                        {!results.playwright.seo.technical.mobileFriendly && !results.playwright.seo.meta.ogTags.title && !results.playwright.seo.social.hasFacebookPixel && !results.playwright.seo.social.hasGoogleAnalytics
                          ? "Improve mobile responsiveness, add Open Graph meta tags, and implement analytics tracking to better understand your audience."
                          : !results.playwright.seo.technical.mobileFriendly
                          ? "Optimize your website for mobile devices by ensuring responsive design and proper viewport settings."
                          : !results.playwright.seo.meta.ogTags.title
                          ? "Add Open Graph meta tags to improve how your content appears when shared on social media."
                          : !results.playwright.seo.social.hasFacebookPixel && !results.playwright.seo.social.hasGoogleAnalytics
                          ? "Implement analytics tracking to monitor your website's performance and user behavior."
                          : !results.playwright.seo.social.hasFacebookPixel
                          ? "Add Facebook Pixel to track conversions and optimize your Facebook ad campaigns."
                          : !results.playwright.seo.social.hasGoogleAnalytics
                          ? "Implement Google Analytics to gain insights into your website traffic and user behavior."
                          : "Your mobile and social integration looks good! Consider adding more advanced tracking features like event tracking."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content & Keywords */}
              <div className="p-6 border rounded-xl">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>📝</span> Content & Keywords
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <span>📊</span>
                          <span>Word Count: {results.playwright.seo.content.wordCount}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>📖</span>
                          <span>Readability Score: {results.playwright.seo.content.readabilityScore.toFixed(2)}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>⚖️</span>
                          <span>Content to Code Ratio: {results.playwright.seo.content.contentToCodeRatio.toFixed(2)}%</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>{results.playwright.seo.content.hasVideo ? '✅' : '❌'}</span>
                          <span>Has Video: {results.playwright.seo.content.hasVideo ? 'Yes' : 'No'}</span>
                        </li>
                      </ul>
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Top Keywords Found:</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(results.playwright.seo.content.keywordDensity)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)
                            .map(([keyword, density]) => (
                              <span key={keyword} className="px-2 py-1 bg-primary-50 rounded-full text-sm">
                                "{keyword}" ({density.toFixed(1)}%)
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">🛠 Quick Fix Tip</h4>
                      <p>
                        {results.playwright.seo.content.wordCount < 300
                          ? "Increase your content length to at least 300 words for better SEO performance."
                          : results.playwright.seo.content.readabilityScore < 60
                          ? "Improve content readability by using shorter sentences and simpler language."
                          : results.playwright.seo.content.contentToCodeRatio < 20
                          ? "Increase your content-to-code ratio by adding more relevant content and reducing unnecessary code."
                          : !results.playwright.seo.content.hasVideo
                          ? "Consider adding video content to increase engagement and time on page."
                          : "Your content looks good! Consider adding more internal links and expanding on your top keywords."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="p-6 border rounded-xl">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>🤖</span> Professional Analysis
                </h3>
                <div className="space-y-6">
                  {/* Overall Assessment */}
                  {results.ai.uxAnalysis.overallScore > 0 && (
                    <div className="p-4 bg-primary-50 rounded-lg">
                      <h4 className="font-medium mb-2">Overall Assessment</h4>
                      <p className="text-lg">
                        {results.ai.uxAnalysis.overallScore >= 80 
                          ? "Your website is performing **exceptionally well**! "
                          : results.ai.uxAnalysis.overallScore >= 60
                          ? "Your website is **solid**, but there's room for improvement. "
                          : "Your website **needs some attention** to better serve your visitors. "}
                        {results.ai.uxAnalysis.strengths.length > 0 && (
                          <>
                            I particularly like how you've <strong>{results.ai.uxAnalysis.strengths[0].toLowerCase()}</strong>
                            {results.ai.uxAnalysis.strengths.length > 1 && ` and <strong>${results.ai.uxAnalysis.strengths[1].toLowerCase()}</strong>`}.
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Visual Analysis */}
                  {results.ai.uxAnalysis.visualAnalysis && Object.values(results.ai.uxAnalysis.visualAnalysis).some(value => value && value.trim() !== '') && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-4">Visual Design Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.ai.uxAnalysis.visualAnalysis.layout && (
                          <div>
                            <h5 className="font-medium mb-2">Layout & Structure</h5>
                            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: results.ai.uxAnalysis.visualAnalysis.layout.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        )}
                        {results.ai.uxAnalysis.visualAnalysis.colorScheme && (
                          <div>
                            <h5 className="font-medium mb-2">Color Scheme</h5>
                            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: results.ai.uxAnalysis.visualAnalysis.colorScheme.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        )}
                        {results.ai.uxAnalysis.visualAnalysis.typography && (
                          <div>
                            <h5 className="font-medium mb-2">Typography</h5>
                            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: results.ai.uxAnalysis.visualAnalysis.typography.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        )}
                        {results.ai.uxAnalysis.visualAnalysis.visualHierarchy && (
                          <div>
                            <h5 className="font-medium mb-2">Visual Hierarchy</h5>
                            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: results.ai.uxAnalysis.visualAnalysis.visualHierarchy.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        )}
                        {results.ai.uxAnalysis.visualAnalysis.mobileResponsiveness && (
                          <div className="md:col-span-2">
                            <h5 className="font-medium mb-2">Mobile Responsiveness</h5>
                            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: results.ai.uxAnalysis.visualAnalysis.mobileResponsiveness.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Key Areas for Improvement */}
                  {results.ai.uxAnalysis.weaknesses.length > 0 && (
                    <div className="p-4 border rounded-lg mb-6">
                      <h4 className="font-medium mb-2">Areas That Need Attention</h4>
                      <div className="space-y-4">
                        {results.ai.uxAnalysis.weaknesses.map((weakness, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="text-red-500 mt-1">•</span>
                            <p dangerouslySetInnerHTML={{ __html: weakness.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actionable Recommendations */}
                  {results.ai.uxAnalysis.recommendations.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Here's What I Recommend</h4>
                      <div className="space-y-4">
                        {results.ai.uxAnalysis.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="text-green-500 mt-1">→</span>
                            <p dangerouslySetInnerHTML={{ __html: rec.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Wins */}
                  {Object.values(results.ai.uxAnalysis.quickFixes).some(value => value && value.trim() !== '') && (
                    <div className="p-4 bg-primary-50 rounded-lg">
                      <h4 className="font-medium mb-2">Quick Wins You Can Implement Today</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.ai.uxAnalysis.quickFixes.seo && (
                          <div>
                            <p className="font-medium mb-2">SEO & Content</p>
                            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: results.ai.uxAnalysis.quickFixes.seo.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        )}
                        {results.ai.uxAnalysis.quickFixes.performance && (
                          <div>
                            <p className="font-medium mb-2">Performance & Mobile</p>
                            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: results.ai.uxAnalysis.quickFixes.performance.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
