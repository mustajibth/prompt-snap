import { GeminiResponse, APIKeyConfig, PromptVariation } from '../types';

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

export function setAPIKeys(keys: string[]) {
  apiKeys = keys.map((key, index) => ({
    id: `key-${index}`,
    key: key.trim(),
    name: `API Key ${index + 1}`,
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

function getNextAPIKey(): string {
  if (apiKeys.length === 0) {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!envKey) {
      throw new Error('No Gemini API keys configured. Please add API keys in settings.');
    }
    return envKey;
  }

  const activeKeys = apiKeys.filter(key => key.isActive);
  if (activeKeys.length === 0) {
    throw new Error('No active API keys available.');
  }

  const key = activeKeys[currentKeyIndex % activeKeys.length];
  currentKeyIndex = (currentKeyIndex + 1) % activeKeys.length;
  
  // Update usage stats
  key.requestCount++;
  key.lastUsed = new Date();

  // Save updated stats to storage
  saveAPIKeysToStorage(apiKeys);

  return key.key;
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const PROMPT_VARIATIONS: Record<string, PromptVariation> = {
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

export async function analyzeImageWithGemini(
  file: File, 
  variation: keyof typeof PROMPT_VARIATIONS = 'creative'
): Promise<string> {
  const apiKey = getNextAPIKey();
  
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    const base64Content = base64Data.split(',')[1];

    const promptStyle = PROMPT_VARIATIONS[variation];
    const systemPrompt = getEnhancedVariationPrompt(promptStyle.style);

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt
            },
            {
              inline_data: {
                mime_type: file.type,
                data: base64Content
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7, // Slightly lower for more consistent results
        topK: 40,
        topP: 0.9, // More focused sampling
        maxOutputTokens: 400, // Increased for more detailed prompts
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini API');
    }

    const prompt = data.candidates[0].content.parts[0].text;
    return cleanAndEnhancePrompt(prompt.trim());
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

function getEnhancedVariationPrompt(style: string): string {
  const baseInstruction = `You are an expert AI prompt engineer specializing in creating highly detailed and accurate prompts for AI image generation. Analyze this image carefully and create a comprehensive prompt that would recreate this image with maximum fidelity.

CRITICAL REQUIREMENTS:
1. Be extremely specific about visual details
2. Include precise color descriptions (use specific color names, not just "blue" but "deep navy blue" or "cerulean blue")
3. Describe lighting conditions in detail (soft diffused light, harsh directional lighting, golden hour, etc.)
4. Specify camera angles and composition (close-up, wide shot, bird's eye view, etc.)
5. Include texture descriptions (smooth, rough, glossy, matte, etc.)
6. Mention artistic style or photographic technique if applicable
7. Describe the mood and atmosphere
8. Include any relevant technical details

FORMAT: Write as a single, flowing prompt without bullet points or sections.`;

  const styleSpecificInstructions = {
    creative: `
CREATIVE FOCUS: Emphasize the artistic and imaginative elements. Describe:
- The emotional impact and mood of the image
- Creative composition techniques used
- Unique visual elements that make it stand out
- Color harmony and artistic choices
- Any surreal or imaginative aspects
- The overall aesthetic appeal and artistic vision

Create a prompt that captures the creative essence and would inspire an AI to generate something equally artistic and visually compelling.`,

    technical: `
TECHNICAL FOCUS: Provide precise technical specifications. Describe:
- Camera settings equivalent (aperture, focal length, depth of field)
- Lighting setup (key light, fill light, rim light positions)
- Composition rules applied (rule of thirds, leading lines, symmetry)
- Image quality aspects (sharpness, contrast, saturation)
- Technical photographic techniques used
- Post-processing effects visible
- Resolution and clarity characteristics

Create a prompt that would help an AI generate technically excellent and professionally composed imagery.`,

    artistic: `
ARTISTIC FOCUS: Analyze the artistic style and technique. Describe:
- Specific art movement or style (impressionist, minimalist, baroque, etc.)
- Brushwork or technique characteristics (if applicable)
- Color palette and color theory application
- Artistic composition and visual flow
- Medium characteristics (oil painting, watercolor, digital art, etc.)
- Artistic influences or references
- Texture and surface qualities

Create a prompt that captures the artistic methodology and would guide an AI to replicate the artistic approach.`,

    commercial: `
COMMERCIAL FOCUS: Emphasize marketable and professional aspects. Describe:
- Professional presentation quality
- Brand-appropriate visual elements
- Target audience appeal
- Commercial photography techniques
- Product placement and styling (if applicable)
- Professional lighting and composition
- Market-ready aesthetic qualities
- Commercial viability factors

Create a prompt suitable for generating professional, market-ready imagery that would work in commercial contexts.`
  };

  return baseInstruction + (styleSpecificInstructions[style] || styleSpecificInstructions.creative);
}

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

export async function analyzeImageFromUrl(
  imageUrl: string, 
  variation: keyof typeof PROMPT_VARIATIONS = 'creative'
): Promise<string> {
  const apiKey = getNextAPIKey();
  
  try {
    // Fetch image and convert to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64Data = await blobToBase64(blob);
    const base64Content = base64Data.split(',')[1];

    const promptStyle = PROMPT_VARIATIONS[variation];
    const systemPrompt = getEnhancedVariationPrompt(promptStyle.style);

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt
            },
            {
              inline_data: {
                mime_type: blob.type,
                data: base64Content
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 400,
      }
    };

    const apiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || apiResponse.statusText}`);
    }

    const data: GeminiResponse = await apiResponse.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini API');
    }

    const prompt = data.candidates[0].content.parts[0].text;
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