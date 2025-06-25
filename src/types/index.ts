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

export interface APIKeyConfig {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  requestCount: number;
  lastUsed?: Date;
}

export interface PromptVariation {
  style: 'creative' | 'technical' | 'artistic' | 'commercial';
  description: string;
}