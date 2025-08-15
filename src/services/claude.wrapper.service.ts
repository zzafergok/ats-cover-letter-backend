import Anthropic from '@anthropic-ai/sdk';
import logger from '../config/logger';

export class ClaudeService {
  private static instance: ClaudeService;
  private anthropic: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  public static getInstance(): ClaudeService {
    if (!ClaudeService.instance) {
      ClaudeService.instance = new ClaudeService();
    }
    return ClaudeService.instance;
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      if (response.content && response.content.length > 0) {
        const content = response.content[0];
        if (content.type === 'text') {
          return content.text;
        }
      }

      throw new Error('No valid response received from Claude');
    } catch (error) {
      logger.error('Failed to generate content with Claude', {
        error,
        prompt: prompt.substring(0, 100),
      });
      throw error;
    }
  }

  async generateStructuredContent<T>(
    prompt: string,
    expectedFormat?: string
  ): Promise<T> {
    try {
      const structuredPrompt = expectedFormat
        ? `${prompt}\n\nPlease respond in the following format:\n${expectedFormat}`
        : prompt;

      const response = await this.generateContent(structuredPrompt);

      // Try to parse as JSON if possible
      try {
        return JSON.parse(response);
      } catch {
        // If not JSON, return as is (cast to T)
        return response as unknown as T;
      }
    } catch (error) {
      logger.error('Failed to generate structured content with Claude', {
        error,
      });
      throw error;
    }
  }

  async analyzeText(text: string, analysisType: string): Promise<string> {
    const prompt = `
Please analyze the following text for ${analysisType}:

Text to analyze:
"""
${text}
"""

Provide a detailed analysis focusing on ${analysisType}.
`;

    return await this.generateContent(prompt);
  }

  async extractKeywords(text: string, count: number = 10): Promise<string[]> {
    const prompt = `
Extract the ${count} most important keywords from the following text. 
Return them as a simple comma-separated list, no additional formatting or explanation.

Text:
"""
${text}
"""
`;

    try {
      const response = await this.generateContent(prompt);
      return response
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean);
    } catch (error) {
      logger.error('Failed to extract keywords', { error });
      return [];
    }
  }

  async improveText(text: string, instructions: string): Promise<string> {
    const prompt = `
Please improve the following text according to these instructions: ${instructions}

Original text:
"""
${text}
"""

Return only the improved text, no additional explanation.
`;

    return await this.generateContent(prompt);
  }
}
