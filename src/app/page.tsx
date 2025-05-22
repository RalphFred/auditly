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
    };
  };
}

export default function Home() {
  const id = useId();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AuditResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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
              disabled={loading}
              className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Submit search"
            >
              <ArrowRightIcon size={16} aria-hidden="true" />
            </button>
          </div>
        </form>

        {loading && (
          <div className="text-center mt-8">
            <p className="text-lg">Running audit...</p>
            <p className="text-sm text-muted-foreground">This may take a few minutes</p>
          </div>
        )}

        {error && (
          <div className="text-center mt-8 text-red-500">
            <p>{error}</p>
          </div>
        )}

        {results && (
          <div className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Audit Results for {results.url}</h2>
            
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
                    <span className="text-yellow-600">{(results.playwright.performance.loadTime / 1000).toFixed(1)}s</span>
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
                      <p>{results.ai.uxAnalysis.quickFixes.seo}</p>
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
                      <p>{results.ai.uxAnalysis.quickFixes.performance}</p>
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
                          <span>Load Time: {(results.playwright.performance.loadTime / 1000).toFixed(1)}s</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>📊</span>
                          <span>Core Web Vitals:</span>
                        </li>
                        <li className="pl-6">• LCP: {results.playwright.seo.technical.coreWebVitals.lcp.toFixed(2)}s</li>
                        <li className="pl-6">• CLS: {results.playwright.seo.technical.coreWebVitals.cls.toFixed(2)}</li>
                        <li className="pl-6">• FID: {results.playwright.seo.technical.coreWebVitals.fid.toFixed(2)}ms</li>
                      </ul>
                    </div>
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">🛠 Quick Fix Tip</h4>
                      <p>{results.ai.uxAnalysis.quickFixes.performance}</p>
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
                      <p>{results.ai.uxAnalysis.quickFixes.mobile}</p>
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
                      <p>{results.ai.uxAnalysis.quickFixes.content}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="p-6 border rounded-xl">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>🤖</span> AI UX Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Strengths</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {results.ai.uxAnalysis.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Areas for Improvement</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {results.ai.uxAnalysis.weaknesses.map((weakness, i) => (
                        <li key={i}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {results.ai.uxAnalysis.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Quick Fixes */}
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Basic Info & SEO</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    {results.playwright.seo.title ? (
                      <span className="text-green-400">✅ Title tag is present</span>
                    ) : (
                      <span className="text-red-400">❌ Missing title tag</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-300 mb-2">
                    {results.playwright.seo.metaDescription ? (
                      <span className="text-green-400">✅ Meta description is present</span>
                    ) : (
                      <span className="text-red-400">❌ Missing meta description</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-300">
                    {results.playwright.seo.schema.hasSchema ? (
                      <span className="text-green-400">✅ Schema markup is present</span>
                    ) : (
                      <span className="text-red-400">❌ Missing schema markup</span>
                    )}
                  </p>
                  <div className="mt-2 p-2 bg-blue-500/10 rounded">
                    <p className="text-sm text-blue-300">Quick Fix: {results.ai.uxAnalysis.quickFixes.seo}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Technical SEO</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    {results.playwright.seo.meta.viewport ? (
                      <span className="text-green-400">✅ Viewport meta tag is present</span>
                    ) : (
                      <span className="text-red-400">❌ Missing viewport meta tag</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-300 mb-2">
                    {results.playwright.seo.meta.robots ? (
                      <span className="text-green-400">✅ Robots meta tag is present</span>
                    ) : (
                      <span className="text-red-400">❌ Missing robots meta tag</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-300">
                    {results.playwright.seo.meta.canonical ? (
                      <span className="text-green-400">✅ Canonical URL is present</span>
                    ) : (
                      <span className="text-red-400">❌ Missing canonical URL</span>
                    )}
                  </p>
                  <div className="mt-2 p-2 bg-blue-500/10 rounded">
                    <p className="text-sm text-blue-300">Quick Fix: {results.ai.uxAnalysis.quickFixes.performance}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Performance</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    Load Time: {results.playwright.performance.loadTime.toFixed(2)}s
                  </p>
                  <p className="text-sm text-gray-300">
                    DOM Content Loaded: {results.playwright.performance.domContentLoaded.toFixed(2)}s
                  </p>
                  <div className="mt-2 p-2 bg-blue-500/10 rounded">
                    <p className="text-sm text-blue-300">Quick Fix: {results.ai.uxAnalysis.quickFixes.performance}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Mobile & Social</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    {results.playwright.seo.meta.ogTags.title ? (
                      <span className="text-green-400">✅ Open Graph title is present</span>
                    ) : (
                      <span className="text-red-400">❌ Missing Open Graph title</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-300">
                    {results.playwright.seo.meta.ogTags.description ? (
                      <span className="text-green-400">✅ Open Graph description is present</span>
                    ) : (
                      <span className="text-red-400">❌ Missing Open Graph description</span>
                    )}
                  </p>
                  <div className="mt-2 p-2 bg-blue-500/10 rounded">
                    <p className="text-sm text-blue-300">Quick Fix: {results.ai.uxAnalysis.quickFixes.mobile}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Content & Keywords</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    {results.playwright.seo.headings.h1.length > 0 ? (
                      <span className="text-green-400">✅ H1 heading is present</span>
                    ) : (
                      <span className="text-red-400">❌ Missing H1 heading</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-300">
                    {results.playwright.seo.images.withoutAlt === 0 ? (
                      <span className="text-green-400">✅ All images have alt text</span>
                    ) : (
                      <span className="text-red-400">❌ {results.playwright.seo.images.withoutAlt} images missing alt text</span>
                    )}
                  </p>
                  <div className="mt-2 p-2 bg-blue-500/10 rounded">
                    <p className="text-sm text-blue-300">Quick Fix: {results.ai.uxAnalysis.quickFixes.content}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Accessibility</h3>
                  <p className="text-sm text-gray-300">
                    {results.playwright.seo.images.withoutAlt === 0 ? (
                      <span className="text-green-400">✅ All images have alt text</span>
                    ) : (
                      <span className="text-red-400">❌ {results.playwright.seo.images.withoutAlt} images missing alt text</span>
                    )}
                  </p>
                  <div className="mt-2 p-2 bg-blue-500/10 rounded">
                    <p className="text-sm text-blue-300">Quick Fix: {results.ai.uxAnalysis.quickFixes.accessibility}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
