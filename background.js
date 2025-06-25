class PromptSnapBackground {
  constructor() {
    this.init();
  }

  init() {
    this.setupContextMenus();
    this.setupMessageHandlers();
  }

  setupContextMenus() {
    chrome.contextMenus.create({
      id: 'promptsnap-analyze-image',
      title: 'Analyze with PromptSnap',
      contexts: ['image']
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'promptsnap-analyze-image') {
        this.analyzeImage(info.srcUrl, tab);
      }
    });
  }

  async analyzeImage(imageUrl, tab) {
    try {
      const settings = await this.getSettings();
      if (!settings.apiKey) {
        this.showNotification('Please configure your API key first', 'error');
        return;
      }

      const prompt = await this.generatePrompt(imageUrl, settings);
      
      // Store result
      await this.storeResult({
        id: Date.now().toString(),
        imageUrl,
        prompt,
        timestamp: new Date().toISOString(),
        source: 'context-menu'
      });

      this.showNotification('Image analyzed successfully!', 'success');
    } catch (error) {
      console.error('Error analyzing image:', error);
      this.showNotification('Failed to analyze image', 'error');
    }
  }

  async generatePrompt(imageUrl, settings) {
    const apiKey = settings.apiKey;
    const model = settings.model || 'gemini-2.0-flash-lite';
    
    // Convert image URL to base64
    const imageData = await this.fetchImageAsBase64(imageUrl);
    
    const promptText = settings.useCustomPrompt && settings.customPrompt 
      ? this.enhanceCustomPrompt(settings.customPrompt)
      : this.getEnhancedDefaultPrompt();

    const requestBody = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: imageData.mimeType,
                data: imageData.base64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7, // More consistent results
        topK: 40,
        topP: 0.9, // More focused
        maxOutputTokens: 400, // More detailed prompts
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini API');
    }

    return this.cleanAndEnhancePrompt(data.candidates[0].content.parts[0].text.trim());
  }

  getEnhancedDefaultPrompt() {
    return `You are an expert AI prompt engineer. Analyze this image with extreme precision and create a highly detailed prompt for AI image generation that would recreate this image with maximum accuracy.

REQUIREMENTS:
1. Be extremely specific about every visual element
2. Use precise color descriptions (specific color names, not generic ones)
3. Describe lighting in detail (direction, quality, color temperature)
4. Specify exact composition and framing
5. Include texture and material descriptions
6. Mention artistic style or photographic technique
7. Describe mood and atmosphere
8. Include any technical camera details you can infer

STRUCTURE: Write as a single, comprehensive prompt without sections or bullet points. Start with the main subject, then describe composition, lighting, colors, textures, style, and mood.

EXAMPLE QUALITY: Instead of "a woman in a red dress" write "a young woman with flowing auburn hair wearing a deep crimson silk evening gown with subtle golden embroidery, photographed in soft golden hour lighting with a shallow depth of field, creating a dreamy bokeh background of warm amber tones"

Analyze the image and create your detailed prompt:`;
  }

  enhanceCustomPrompt(customPrompt) {
    const enhancementPrefix = `You are an expert AI prompt engineer. Using the following custom instructions as your guide, analyze this image with extreme precision and create a highly detailed prompt for AI image generation.

CUSTOM INSTRUCTIONS: ${customPrompt}

ENHANCEMENT REQUIREMENTS:
- Be extremely specific about visual details
- Use precise color descriptions
- Describe lighting conditions in detail
- Include composition and framing details
- Mention textures and materials
- Specify artistic style if applicable
- Describe mood and atmosphere

Create your enhanced prompt based on the custom instructions above:`;

    return enhancementPrefix;
  }

  cleanAndEnhancePrompt(prompt) {
    // Remove common AI artifacts
    let cleaned = prompt
      .replace(/^(Here's|Here is|This is|I can see|The image shows|This image depicts|Based on the image)/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Ensure proper capitalization
    if (!cleaned.match(/^[A-Z]/)) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Add quality enhancers if missing
    const qualityTerms = ['detailed', 'high quality', 'professional', 'sharp', 'clear'];
    const hasQualityTerm = qualityTerms.some(term => cleaned.toLowerCase().includes(term));
    
    if (!hasQualityTerm) {
      cleaned = `Highly detailed, professional quality, ${cleaned}`;
    }

    // Ensure proper ending
    if (!cleaned.endsWith('.') && !cleaned.endsWith(',')) {
      cleaned += '.';
    }

    // Add technical enhancement for better AI generation
    if (!cleaned.includes('8k') && !cleaned.includes('4k') && !cleaned.includes('high resolution')) {
      cleaned += ' High resolution, sharp focus, professional photography quality.';
    }

    return cleaned;
  }

  async fetchImageAsBase64(imageUrl) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          base64: base64Data,
          mimeType: blob.type
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'analyzeImages':
          const results = await this.analyzeMultipleImages(request.images, request.settings);
          sendResponse({ success: true, results });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async analyzeMultipleImages(images, settings) {
    const results = [];
    
    for (const imageUrl of images) {
      try {
        const prompt = await this.generatePrompt(imageUrl, settings);
        const result = {
          id: Date.now().toString() + Math.random(),
          imageUrl,
          prompt,
          timestamp: new Date().toISOString(),
          source: 'page-scan'
        };
        
        await this.storeResult(result);
        results.push(result);
      } catch (error) {
        console.error('Error analyzing image:', imageUrl, error);
      }
    }
    
    return results;
  }

  async getSettings() {
    const result = await chrome.storage.sync.get(['apiKey', 'model', 'useCustomPrompt', 'customPrompt']);
    return result;
  }

  async storeResult(result) {
    const { promptResults = [] } = await chrome.storage.local.get(['promptResults']);
    promptResults.unshift(result);
    
    // Keep only last 50 results
    if (promptResults.length > 50) {
      promptResults.splice(50);
    }
    
    await chrome.storage.local.set({ promptResults });
  }

  showNotification(message, type = 'basic') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'PromptSnap',
      message: message
    });
  }
}

// Initialize background script
new PromptSnapBackground();