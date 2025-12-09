import { GeminiResponse, APIKeyConfig, PromptVariation, AIProvider } from '../types';
import { analyzeWithProvider } from './aiProviders';

// API Key Management
const STORAGE_KEY = 'promptsnap_api_keys';
let apiKeys: APIKeyConfig[] = [];
let currentKeyIndex = 0;

// Load API keys from localStorage on initialization
function loadAPIKeysFromStorage(): APIKeyConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading API keys from storage:', error);
  }
  return [];
}

// Save API keys to localStorage
function saveAPIKeysToStorage(keys: APIKeyConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error('Error saving API keys to storage:', error);
  }
}

// Initialize API keys from storage
apiKeys = loadAPIKeysFromStorage();

export function setAPIKeys(keys: string[], provider: AIProvider = 'gemini') {
  apiKeys = keys.map((key, index) => ({
    id: `key-${index}`,
    key: key.trim(),
    name: `API Key ${index + 1}`,
    provider,
    isActive: true,
    requestCount: 0
  }));
  saveAPIKeysToStorage(apiKeys);
}

export function getAPIKeys(): APIKeyConfig[] {
  if (apiKeys.length === 0) {
    apiKeys = loadAPIKeysFromStorage();
  }
  return apiKeys;
}

export function updateAPIKeys(keys: APIKeyConfig[]) {
  apiKeys = keys;
  saveAPIKeysToStorage(apiKeys);
}

function getNextAPIKey(): { key: string; provider: AIProvider } {
  if (apiKeys.length === 0) {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!envKey) {
      throw new Error('No AI API keys configured. Please add API keys in settings.');
    }
    return { key: envKey, provider: 'gemini' };
  }

  const activeKeys = apiKeys.filter(key => key.isActive);
  if (activeKeys.length === 0) {
    throw new Error('No active API keys available.');
  }

  const keyConfig = activeKeys[currentKeyIndex % activeKeys.length];
  currentKeyIndex = (currentKeyIndex + 1) % activeKeys.length;

  // Update usage stats
  keyConfig.requestCount++;
  keyConfig.lastUsed = new Date();

  // Save updated stats to storage
  saveAPIKeysToStorage(apiKeys);

  return { key: keyConfig.key, provider: keyConfig.provider };
}

export const PROMPT_VARIATIONS: Record<string, PromptVariation> = {
  creative: {
    style: 'creative',
    description: 'Focus on artistic elements, mood, and creative interpretation'
  },
  technical: {
    style: 'technical',
    description: 'Detailed technical specifications, lighting, and composition'
  },
  artistic: {
    style: 'artistic',
    description: 'Art style, technique, and visual aesthetics'
  },
  commercial: {
    style: 'commercial',
    description: 'Marketing-focused, brand-suitable descriptions'
  }
};

function cleanAndEnhancePrompt(prompt: string): string {
  // Remove common AI-generated text artifacts
  let cleaned = prompt
    .replace(/^(Here's|Here is|This is|I can see|The image shows|This image depicts)/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure it starts with a descriptive word
  if (!cleaned.match(/^[A-Z]/)) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Add professional prompt structure if missing
  if (!cleaned.includes('detailed') && !cleaned.includes('high quality')) {
    cleaned = `Highly detailed, professional quality, ${cleaned}`;
  }

  // Ensure it ends properly
  if (!cleaned.endsWith('.') && !cleaned.endsWith(',')) {
    cleaned += '.';
  }

  return cleaned;
}

export async function analyzeImageWithGemini(
  file: File,
  variation: keyof typeof PROMPT_VARIATIONS = 'creative'
): Promise<string> {
  const { key: apiKey, provider } = getNextAPIKey();

  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    const base64Content = base64Data.split(',')[1];

    const prompt = await analyzeWithProvider(
      provider,
      apiKey,
      base64Content,
      file.type,
      variation
    );

    return cleanAndEnhancePrompt(prompt.trim());
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}


export async function analyzeImageFromUrl(
  imageUrl: string,
  variation: keyof typeof PROMPT_VARIATIONS = 'creative'
): Promise<string> {
  const { key: apiKey, provider } = getNextAPIKey();

  try {
    // Fetch image and convert to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64Data = await blobToBase64(blob);
    const base64Content = base64Data.split(',')[1];

    const prompt = await analyzeWithProvider(
      provider,
      apiKey,
      base64Content,
      blob.type,
      variation
    );

    return cleanAndEnhancePrompt(prompt.trim());
  } catch (error) {
    console.error('Error analyzing image from URL:', error);
    throw error;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export function getPromptVariations(): PromptVariation[] {
  return Object.values(PROMPT_VARIATIONS);
}