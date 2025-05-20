import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIAuditResult {
  status: 'success' | 'error';
  uxAnalysis: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  error?: string;
}

export async function runAIAudit(url: string): Promise<AIAuditResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error('GOOGLE_AI_API_KEY is not set');
    return {
      status: 'error',
      uxAnalysis: {
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        recommendations: [],
      },
      error: 'AI analysis is not configured. Please set GOOGLE_AI_API_KEY in your environment variables.',
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Analyze the following website for UX/UI design and user experience: ${url}
      
      Please provide:
      1. An overall UX score (0-100)
      2. Key strengths of the design
      3. Areas for improvement
      4. Specific recommendations
      
      Format the response as a JSON object with the following structure:
      {
        "overallScore": number,
        "strengths": string[],
        "weaknesses": string[],
        "recommendations": string[]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Parse the JSON response
      const analysis = JSON.parse(text);

      return {
        status: 'success',
        uxAnalysis: {
          overallScore: analysis.overallScore,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          recommendations: analysis.recommendations,
        },
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return {
        status: 'error',
        uxAnalysis: {
          overallScore: 0,
          strengths: [],
          weaknesses: [],
          recommendations: [],
        },
        error: 'Failed to parse AI analysis response',
      };
    }
  } catch (error) {
    console.error('AI audit failed:', error);
    return {
      status: 'error',
      uxAnalysis: {
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        recommendations: [],
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
} 