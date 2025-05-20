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
      };
      links: {
        total: number;
        internal: number;
        external: number;
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
      };
      schema: {
        hasSchema: boolean;
        types: string[];
      };
    };
    performance: {
      loadTime: number;
      domContentLoaded: number;
    };
  };
  lighthouse: {
    status: 'success' | 'error';
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    progressiveWebApp: number;
  };
  ai: {
    status: 'success' | 'error';
    uxAnalysis: {
      overallScore: number;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
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
            
            {/* SEO Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">SEO Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Basic SEO</h4>
                  <ul className="space-y-2">
                    <li><span className="font-semibold">Title</span>: {results.playwright.seo.title || 'Missing'}</li>
                    <li><span className="font-semibold">Meta Description</span>: {results.playwright.seo.metaDescription || 'Missing'}</li>
                    <li><span className="font-semibold">Images without Alt</span>: {results.playwright.seo.images.withoutAlt}</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Performance</h4>
                  <ul className="space-y-2">
                    <li><span className="font-semibold">Load Time</span>: {(results.playwright.performance.loadTime / 1000).toFixed(2)}s</li>
                    <li><span className="font-semibold">DOM Content Loaded</span>: {(results.playwright.performance.domContentLoaded / 1000).toFixed(2)}s</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Lighthouse Scores */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Lighthouse Scores</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <h4 className="font-medium mb-2">Performance</h4>
                  <p className="text-2xl font-bold">{results.lighthouse.performance}</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <h4 className="font-medium mb-2">Accessibility</h4>
                  <p className="text-2xl font-bold">{results.lighthouse.accessibility}</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <h4 className="font-medium mb-2">Best Practices</h4>
                  <p className="text-2xl font-bold">{results.lighthouse.bestPractices}</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <h4 className="font-medium mb-2">SEO</h4>
                  <p className="text-2xl font-bold">{results.lighthouse.seo}</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <h4 className="font-medium mb-2">PWA</h4>
                  <p className="text-2xl font-bold">{results.lighthouse.progressiveWebApp}</p>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">AI UX Analysis</h3>
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
          </div>
        )}
      </div>
    </div>
  );
}
