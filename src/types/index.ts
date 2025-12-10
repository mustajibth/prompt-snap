export interface ImageAnalysis {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  prompt?: string;
  error?: string;
  source?: 'upload' | 'adobe-stock' | 'vecteezy';
  originalUrl?: string;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export interface ScrapedImage {
  url: string;
  title: string;
  source: 'adobe-stock' | 'vecteezy';
  thumbnail: string;
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic';

export interface APIKeyConfig {
  id: string;
  key: string;
  name: string;
  provider: AIProvider;
  isActive: boolean;
  requestCount: number;
  lastUsed?: Date;
}

export interface AIResponse {
  text: string;
}

export interface PromptVariation {
  style: 'creative' | 'technical' | 'artistic' | 'commercial';
  description: string;
}