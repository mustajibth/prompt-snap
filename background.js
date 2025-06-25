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
      ? settings.customPrompt
      : 'Analyze this image and create a detailed prompt for AI image generation. Focus on describing the visual elements, style, composition, colors, lighting, mood, and artistic technique. Make it specific and vivid for AI art generation.';

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
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 300,
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

    return data.candidates[0].content.parts[0].text.trim();
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