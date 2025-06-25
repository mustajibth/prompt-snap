import { GeminiResponse, APIKeyConfig, PromptVariation } from '../types';

// API Key Management
let apiKeys: APIKeyConfig[] = [];
let currentKeyIndex = 0;

export function setAPIKeys(keys: string[]) {
  apiKeys = keys.map((key, index) => ({
    id: `key-${index}`,
    key: key.trim(),
    name: `API Key ${index + 1}`,
    isActive: true,
    requestCount: 0
  }));
}

export function getAPIKeys(): APIKeyConfig[] {
  return apiKeys;
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
    const systemPrompt = getVariationPrompt(promptStyle.style);

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
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 300,
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
    return prompt.trim();
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

function getVariationPrompt(style: string): string {
  const basePrompt = "Analyze this image and create a detailed prompt for AI image generation. ";
  
  switch (style) {
    case 'creative':
      return basePrompt + "Focus on the creative and artistic elements: describe the mood, atmosphere, color palette, artistic style, and emotional impact. Make it inspiring and imaginative, perfect for creative AI generation. Extract the visual essence and transform it into a unique, creative description.";
    
    case 'technical':
      return basePrompt + "Provide technical specifications: camera settings, lighting setup, composition rules, depth of field, perspective, and technical aspects. Include details about resolution, quality, and photographic techniques used.";
    
    case 'artistic':
      return basePrompt + "Emphasize the artistic style and technique: art movement, brushwork, texture, medium, artistic influences, and aesthetic qualities. Describe it as if instructing an artist or AI to recreate the artistic approach.";
    
    case 'commercial':
      return basePrompt + "Create a commercial-focused description: brand-suitable elements, market appeal, target audience, commercial viability, and professional presentation. Make it suitable for marketing and business use.";
    
    default:
      return basePrompt + "Focus on describing the visual elements, style, composition, colors, lighting, mood, and artistic technique. Make it specific and vivid for AI art generation.";
  }
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
    const systemPrompt = getVariationPrompt(promptStyle.style);

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
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 300,
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
    return prompt.trim();
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