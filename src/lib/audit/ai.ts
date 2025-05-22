import { GoogleGenerativeAI, GenerativeModel, Content } from '@google/generative-ai';

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
      accessibility: string;
      mobile: string;
      content: string;
    };
  };
  error?: string;
}

export async function runAIAudit(url: string): Promise<AIAuditResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error('NEXT_PUBLIC_GOOGLE_AI_API_KEY is not set');
    return {
      status: 'error',
      uxAnalysis: {
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        recommendations: [],
        quickFixes: {
          seo: '',
          performance: '',
          accessibility: '',
          mobile: '',
          content: ''
        }
      },
      error: 'AI analysis is not configured. Please set NEXT_PUBLIC_GOOGLE_AI_API_KEY in your environment variables.',
    };
  }

  try {
    console.log('Initializing Google AI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log('Getting generative model...');
    const model: GenerativeModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    console.log('Preparing prompt...');
    const prompt = `
      Analyze the following website for UX/UI design and user experience: ${url}
      
      You must respond with a valid JSON object in exactly this format:
      {
        "overallScore": 85,
        "strengths": ["Clear navigation", "Responsive design", "Fast loading"],
        "weaknesses": ["Missing alt text", "Poor contrast", "Complex forms"],
        "recommendations": ["Add alt text to images", "Improve color contrast", "Simplify form fields"],
        "quickFixes": {
          "seo": "Add meta descriptions and optimize title tags",
          "performance": "Compress images and enable caching",
          "accessibility": "Add ARIA labels and improve keyboard navigation",
          "mobile": "Fix viewport settings and touch targets",
          "content": "Improve readability and add more engaging visuals"
        }
      }

      Rules:
      1. overallScore must be a number between 0 and 100
      2. strengths must be an array of 3-5 strings
      3. weaknesses must be an array of 3-5 strings
      4. recommendations must be an array of 3-5 strings
      5. quickFixes must be an object with exactly these keys: seo, performance, accessibility, mobile, content
      6. Each quickFix should be a single, actionable sentence
      7. Do not include any text before or after the JSON
      8. Do not use markdown formatting
      9. Do not include any explanations or additional text

      Focus on:
      - Visual design and aesthetics
      - User interface elements and interactions
      - Content organization and readability
      - Mobile responsiveness
      - Loading performance
      - Accessibility features
      
      Keep each point concise and actionable.
    `;

    console.log('Starting chat...');
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });

    console.log('Generating content...');
    const result = await chat.sendMessage([{ text: "Return only the JSON analysis, no additional text or formatting." }]);
    const response = result.response;
    const text = response.text();
    
    console.log('Raw AI response:', text);
    console.log('Response type:', typeof text);
    
    console.log('Parsing AI response...');
    try {
      // Try to clean the response text before parsing
      const cleanedText = text.trim().replace(/```json\n?|\n?```/g, '');
      console.log('Cleaned response text:', cleanedText);
      
      // Parse the JSON response
      const analysis = JSON.parse(cleanedText);
      console.log('Parsed analysis:', analysis);

      // Validate the response structure
      if (!analysis.overallScore || 
          !Array.isArray(analysis.strengths) || 
          !Array.isArray(analysis.weaknesses) || 
          !Array.isArray(analysis.recommendations) ||
          !analysis.quickFixes ||
          typeof analysis.quickFixes !== 'object' ||
          !analysis.quickFixes.seo ||
          !analysis.quickFixes.performance ||
          !analysis.quickFixes.accessibility ||
          !analysis.quickFixes.mobile ||
          !analysis.quickFixes.content) {
        console.error('Invalid response structure:', {
          hasOverallScore: !!analysis.overallScore,
          hasStrengths: Array.isArray(analysis.strengths),
          hasWeaknesses: Array.isArray(analysis.weaknesses),
          hasRecommendations: Array.isArray(analysis.recommendations),
          hasQuickFixes: !!analysis.quickFixes,
          quickFixesKeys: analysis.quickFixes ? Object.keys(analysis.quickFixes) : []
        });
        throw new Error('Invalid response structure from AI');
      }

      return {
        status: 'success',
        uxAnalysis: {
          overallScore: analysis.overallScore,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          recommendations: analysis.recommendations,
          quickFixes: analysis.quickFixes
        },
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', text);
      return {
        status: 'error',
        uxAnalysis: {
          overallScore: 0,
          strengths: [],
          weaknesses: [],
          recommendations: [],
          quickFixes: {
            seo: '',
            performance: '',
            accessibility: '',
            mobile: '',
            content: ''
          }
        },
        error: 'Failed to parse AI analysis response',
      };
    }
  } catch (error) {
    console.error('AI audit failed:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('API key status:', apiKey ? 'Present' : 'Missing');
      console.error('API key length:', apiKey?.length || 0);
    }
    return {
      status: 'error',
      uxAnalysis: {
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        recommendations: [],
        quickFixes: {
          seo: '',
          performance: '',
          accessibility: '',
          mobile: '',
          content: ''
        }
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
} 