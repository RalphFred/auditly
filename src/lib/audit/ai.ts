import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

export interface AIAuditResult {
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
    visualAnalysis?: {
      layout: string;
      colorScheme: string;
      typography: string;
      visualHierarchy: string;
      mobileResponsiveness: string;
    };
  };
  error?: string;
}

export async function runAIAudit(url: string, screenshots?: { fullPage: string; viewport: string }): Promise<AIAuditResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  try {
    // Prepare the base prompt
    const basePrompt = `Analyze this website's UX/UI and provide a professional assessment. Consider:
    1. Overall user experience and design quality
    2. Content organization and readability
    3. Navigation and information architecture
    4. Mobile responsiveness
    5. Visual design and branding
    6. Call-to-actions and conversion elements
    7. Accessibility considerations

    Provide specific, actionable recommendations for improvement.`;

    let prompt = basePrompt;
    let imageParts: { inlineData: { data: string; mimeType: string } }[] = [];

    // If screenshots are provided, add them to the analysis
    if (screenshots) {
      prompt += `\n\nI've provided screenshots of the website. Please analyze the visual aspects including:
      1. Layout and composition
      2. Color scheme and contrast
      3. Typography and readability
      4. Visual hierarchy
      5. Mobile responsiveness from the viewport screenshot`;

      // Read and encode the screenshots
      const fullPagePath = path.join(process.cwd(), 'public', screenshots.fullPage);
      const viewportPath = path.join(process.cwd(), 'public', screenshots.viewport);

      const fullPageImage = await fs.promises.readFile(fullPagePath);
      const viewportImage = await fs.promises.readFile(viewportPath);

      imageParts = [
        {
          inlineData: {
            data: viewportImage.toString('base64'),
            mimeType: 'image/png'
          }
        },
        {
          inlineData: {
            data: fullPageImage.toString('base64'),
            mimeType: 'image/png'
          }
        }
      ];
    }

    // Generate the analysis
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Parse the response and structure it
    const analysis = parseAIResponse(text);

    return {
      status: 'success',
      uxAnalysis: {
        ...analysis,
        visualAnalysis: screenshots ? parseVisualAnalysis(text) : undefined
      }
    };
  } catch (error) {
    console.error('AI Audit Error:', error);
    throw error;
  }
}

function parseAIResponse(text: string) {
  // Extract overall score (assuming it's mentioned in the text)
  const scoreMatch = text.match(/overall score:?\s*(\d+)/i);
  const overallScore = scoreMatch ? parseInt(scoreMatch[1]) : 70;

  // Extract strengths, weaknesses, and recommendations
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // Simple parsing logic - you might want to make this more robust
  const lines = text.split('\n');
  let currentSection = '';

  for (const line of lines) {
    if (line.toLowerCase().includes('strength')) {
      currentSection = 'strengths';
    } else if (line.toLowerCase().includes('weakness') || line.toLowerCase().includes('issue')) {
      currentSection = 'weaknesses';
    } else if (line.toLowerCase().includes('recommend') || line.toLowerCase().includes('suggestion')) {
      currentSection = 'recommendations';
    } else if (line.trim() && currentSection) {
      if (currentSection === 'strengths') strengths.push(line.trim());
      if (currentSection === 'weaknesses') weaknesses.push(line.trim());
      if (currentSection === 'recommendations') recommendations.push(line.trim());
    }
  }

  return {
    overallScore,
    strengths,
    weaknesses,
    recommendations,
    quickFixes: {
      seo: extractQuickFix(text, 'seo'),
      performance: extractQuickFix(text, 'performance'),
      mobile: extractQuickFix(text, 'mobile'),
      content: extractQuickFix(text, 'content'),
      accessibility: extractQuickFix(text, 'accessibility')
    }
  };
}

function parseVisualAnalysis(text: string) {
  const visualAnalysis = {
    layout: '',
    colorScheme: '',
    typography: '',
    visualHierarchy: '',
    mobileResponsiveness: ''
  };

  const lines = text.split('\n');
  let currentSection = '';

  for (const line of lines) {
    if (line.toLowerCase().includes('layout')) {
      currentSection = 'layout';
    } else if (line.toLowerCase().includes('color')) {
      currentSection = 'colorScheme';
    } else if (line.toLowerCase().includes('typography') || line.toLowerCase().includes('font')) {
      currentSection = 'typography';
    } else if (line.toLowerCase().includes('hierarchy')) {
      currentSection = 'visualHierarchy';
    } else if (line.toLowerCase().includes('mobile') || line.toLowerCase().includes('responsive')) {
      currentSection = 'mobileResponsiveness';
    } else if (line.trim() && currentSection) {
      visualAnalysis[currentSection as keyof typeof visualAnalysis] = line.trim();
    }
  }

  return visualAnalysis;
}

function extractQuickFix(text: string, category: string): string {
  const categoryRegex = new RegExp(`${category}.*?quick fix:?(.*?)(?=\\n|$)`, 'i');
  const match = text.match(categoryRegex);
  return match ? match[1].trim() : `No quick fix available for ${category}`;
} 