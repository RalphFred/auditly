export interface AuditResults {
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