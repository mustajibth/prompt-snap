import { verifySerialNumber } from './verifySerialNumber'

async function checkSerial(serial) {
  const result = await verifySerialNumber(serial)
  console.log(result.message)
}

class PromptSnapScanner {
  constructor() {
    this.init();
  }

  init() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'scanImages') {
        this.scanAndAnalyzeImages(request.settings);
        sendResponse({ success: true });
      }
    });
  }

  async scanAndAnalyzeImages(settings) {
    // Find all images on the page
    const images = document.querySelectorAll('img');
    const imageUrls = [];

    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      // Only include visible images that are reasonably sized
      if (rect.width >= 100 && rect.height >= 100 && img.src && !img.src.startsWith('data:')) {
        imageUrls.push(img.src);
      }
    });

    if (imageUrls.length === 0) {
      this.showMessage('No suitable images found on this page', 'warning');
      return;
    }

    // Limit to first 5 images to avoid overwhelming the API
    const limitedUrls = imageUrls.slice(0, 5);
    
    this.showMessage(`Found ${imageUrls.length} images, analyzing first ${limitedUrls.length}...`, 'info');

    try {
      // Send images to background script for analysis
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeImages',
        images: limitedUrls,
        settings: settings
      });

      if (response.success) {
        this.showMessage(`Successfully analyzed ${response.results.length} images!`, 'success');
      } else {
        this.showMessage('Error analyzing images: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      this.showMessage('Error analyzing images', 'error');
    }
  }

  showMessage(text, type = 'info') {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 300px;
    `;

    switch (type) {
      case 'success':
        notification.style.background = '#10b981';
        break;
      case 'error':
        notification.style.background = '#ef4444';
        break;
      case 'warning':
        notification.style.background = '#f59e0b';
        break;
      default:
        notification.style.background = '#3b82f6';
    }

    notification.textContent = text;
    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  }
}

// Initialize scanner
new PromptSnapScanner();