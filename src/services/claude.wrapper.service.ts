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
        model: 'claude-sonnet-4-20250514',
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

  /**
   * AI-powered CV parsing
   */
  async parseCvContent(cvText: string): Promise<any> {
    const prompt = `
Analyze the following CV/Resume text and extract all relevant information into a structured JSON format. 
Be very thorough and extract every piece of information you can find, even if the formatting is poor or inconsistent.

Please extract:
1. Personal Information (name, email, phone, address, LinkedIn, GitHub, etc.)
2. Professional Summary/Objective
3. Work Experience (company, position, dates, responsibilities, achievements)
4. Education (degree, institution, graduation date, GPA if mentioned)
5. Skills (technical, soft skills, programming languages, tools, etc.)
6. Languages (language name and proficiency level)
7. Certifications and Licenses
8. Projects (if mentioned)
9. Awards and Achievements
10. Volunteer Experience
11. References (if mentioned)

CV Text:
"""
${cvText}
"""

Respond with ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "personalInfo": {
    "fullName": "",
    "email": "",
    "phone": "",
    "address": "",
    "linkedin": "",
    "github": "",
    "website": "",
    "other": {}
  },
  "summary": "",
  "experience": [
    {
      "company": "",
      "position": "",
      "startDate": "",
      "endDate": "",
      "isCurrent": false,
      "location": "",
      "responsibilities": [],
      "achievements": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "startDate": "",
      "endDate": "",
      "gpa": "",
      "location": ""
    }
  ],
  "skills": {
    "technical": [],
    "soft": [],
    "programming": [],
    "tools": [],
    "other": []
  },
  "languages": [
    {
      "language": "",
      "level": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": "",
      "credentialId": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "url": ""
    }
  ],
  "awards": [],
  "volunteer": [],
  "references": []
}`;

    try {
      const response = await this.generateContent(prompt);
      // Claude sometimes wraps JSON in markdown, so let's clean it
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      logger.error('Failed to parse CV with AI', { error });
      // Return fallback structure if parsing fails
      return {
        personalInfo: {},
        summary: '',
        experience: [],
        education: [],
        skills: {
          technical: [],
          soft: [],
          programming: [],
          tools: [],
          other: [],
        },
        languages: [],
        certifications: [],
        projects: [],
        awards: [],
        volunteer: [],
        references: [],
      };
    }
  }
}
