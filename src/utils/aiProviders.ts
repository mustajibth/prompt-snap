import { AIProvider, PromptVariation } from '../types';

export interface ProviderConfig {
  name: string;
  label: string;
  placeholder: string;
  apiEndpoint: string;
  requiresVisionSupport: boolean;
}

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  gemini: {
    name: 'gemini',
    label: 'Google Gemini',
    placeholder: 'AIzaSy...',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    requiresVisionSupport: true
  },
  openai: {
    name: 'openai',
    label: 'OpenAI GPT-4o',
    placeholder: 'sk-...',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    requiresVisionSupport: true
  },
  anthropic: {
    name: 'anthropic',
    label: 'Claude 3 Haiku',
    placeholder: 'sk-ant-...',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    requiresVisionSupport: true
  }
};

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

  return baseInstruction + (styleSpecificInstructions[style as keyof typeof styleSpecificInstructions] || styleSpecificInstructions.creative);
}

export async function analyzeWithGemini(
  apiKey: string,
  base64Image: string,
  mimeType: string,
  variation: keyof typeof import('../utils/gemini').PROMPT_VARIATIONS
): Promise<string> {
  const config = PROVIDER_CONFIGS.gemini;
  const systemPrompt = getEnhancedVariationPrompt(variation);

  const requestBody = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
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

  const response = await fetch(`${config.apiEndpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response generated from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

export async function analyzeWithOpenAI(
  apiKey: string,
  base64Image: string,
  mimeType: string,
  variation: string
): Promise<string> {
  const config = PROVIDER_CONFIGS.openai;
  const systemPrompt = getEnhancedVariationPrompt(variation);

  const requestBody = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: systemPrompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 400,
    temperature: 0.7
  };

  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function analyzeWithAnthropic(
  apiKey: string,
  base64Image: string,
  mimeType: string,
  variation: string
): Promise<string> {
  const config = PROVIDER_CONFIGS.anthropic;
  const systemPrompt = getEnhancedVariationPrompt(variation);

  const requestBody = {
    model: 'claude-3-haiku-20240307',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: systemPrompt },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: base64Image
            }
          }
        ]
      }
    ]
  };

  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function analyzeWithProvider(
  provider: AIProvider,
  apiKey: string,
  base64Image: string,
  mimeType: string,
  variation: string
): Promise<string> {
  switch (provider) {
    case 'gemini':
      return analyzeWithGemini(apiKey, base64Image, mimeType, variation as any);
    case 'openai':
      return analyzeWithOpenAI(apiKey, base64Image, mimeType, variation);
    case 'anthropic':
      return analyzeWithAnthropic(apiKey, base64Image, mimeType, variation);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
