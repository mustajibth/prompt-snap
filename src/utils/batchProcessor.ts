import { analyzeImageFromUrl } from './gemini';
import { ScrapedImage } from '../types';

export interface BatchProcessingOptions {
  maxConcurrent: number;
  delayBetweenRequests: number;
  retryAttempts: number;
  onProgress?: (completed: number, total: number, currentImage: string) => void;
  onError?: (error: string, imageUrl: string) => void;
}

export interface BatchResult {
  imageUrl: string;
  prompt?: string;
  error?: string;
  success: boolean;
}

export class BatchProcessor {
  private options: BatchProcessingOptions;
  
  constructor(options: Partial<BatchProcessingOptions> = {}) {
    this.options = {
      maxConcurrent: 5,
      delayBetweenRequests: 1000,
      retryAttempts: 3,
      ...options
    };
  }

  async processImages(images: ScrapedImage[], variation: string = 'creative'): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const chunks = this.chunkArray(images, this.options.maxConcurrent);
    
    let completedCount = 0;
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (image) => {
        try {
          this.options.onProgress?.(completedCount, images.length, image.title);
          
          const prompt = await this.processImageWithRetry(image.thumbnail, variation);
          
          completedCount++;
          this.options.onProgress?.(completedCount, images.length, image.title);
          
          return {
            imageUrl: image.url,
            prompt,
            success: true
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.options.onError?.(errorMessage, image.url);
          
          completedCount++;
          this.options.onProgress?.(completedCount, images.length, image.title);
          
          return {
            imageUrl: image.url,
            error: errorMessage,
            success: false
          };
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      
      // Add delay between chunks to respect rate limits
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await this.delay(this.options.delayBetweenRequests);
      }
    }
    
    return results;
  }

  private async processImageWithRetry(imageUrl: string, variation: string): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        return await analyzeImageFromUrl(imageUrl, variation as any);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.options.retryAttempts) {
          // Exponential backoff
          const backoffDelay = Math.pow(2, attempt) * 1000;
          await this.delay(backoffDelay);
        }
      }
    }
    
    throw lastError;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function estimateProcessingTime(imageCount: number, maxConcurrent: number = 5): {
  estimatedMinutes: number;
  estimatedSeconds: number;
} {
  // Estimate ~3 seconds per image analysis + delays
  const avgTimePerImage = 3000; // 3 seconds
  const delayBetweenBatches = 1000; // 1 second
  const batchCount = Math.ceil(imageCount / maxConcurrent);
  
  const totalTime = (imageCount * avgTimePerImage) + (batchCount * delayBetweenBatches);
  const totalSeconds = Math.ceil(totalTime / 1000);
  
  return {
    estimatedMinutes: Math.floor(totalSeconds / 60),
    estimatedSeconds: totalSeconds % 60
  };
}