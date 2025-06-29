class PromptSnapPopup {
  constructor() {
    this.settings = {
      apiKey: '',
      model: 'gemini-2.0-flash-lite',
      useCustomPrompt: false,
      customPrompt: ''
    };
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
    await this.loadResults();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['apiKey', 'model', 'useCustomPrompt', 'customPrompt']);
      this.settings = { ...this.settings, ...result };
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async saveSettings() {
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.innerHTML;
    
    try {
      saveBtn.classList.add('loading');
      saveBtn.disabled = true;
      
      await chrome.storage.sync.set(this.settings);
      this.showNotification('✅ Settings saved successfully!', 'success');
      
      // Visual feedback
      saveBtn.innerHTML = '✅ Saved!';
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
      }, 1500);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showNotification('❌ Error saving settings', 'error');
      saveBtn.classList.remove('loading');
      saveBtn.disabled = false;
    }
  }

  setupEventListeners() {
    // API Key toggle with improved UX
    const toggleBtn = document.getElementById('toggleKey');
    const apiKeyInput = document.getElementById('apiKey');
    
    toggleBtn.addEventListener('click', () => {
      const isPassword = apiKeyInput.type === 'password';
      apiKeyInput.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? '🙈' : '👁️';
      toggleBtn.setAttribute('aria-label', isPassword ? 'Hide API key' : 'Show API key');
    });

    // Settings inputs with real-time validation
    apiKeyInput.addEventListener('input', (e) => {
      this.settings.apiKey = e.target.value.trim();
      this.validateApiKey(e.target.value);
    });

    document.getElementById('modelSelect').addEventListener('change', (e) => {
      this.settings.model = e.target.value;
    });

    const customPromptToggle = document.getElementById('useCustomPrompt');
    customPromptToggle.addEventListener('change', (e) => {
      this.settings.useCustomPrompt = e.target.checked;
      this.toggleCustomPrompt(e.target.checked);
    });

    document.getElementById('customPrompt').addEventListener('input', (e) => {
      this.settings.customPrompt = e.target.value;
    });

    // Action buttons with improved feedback
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('scanBtn').addEventListener('click', () => {
      this.scanPageImages();
    });

    document.getElementById('clearResults').addEventListener('click', () => {
      this.clearResults();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            this.saveSettings();
            break;
          case 'Enter':
            if (e.target.id === 'apiKey') {
              e.preventDefault();
              this.saveSettings();
            }
            break;
        }
      }
    });
  }

  validateApiKey(key) {
    const apiKeyInput = document.getElementById('apiKey');
    const isValid = key.length > 20 && key.startsWith('AIza');
    
    if (key.length > 0) {
      apiKeyInput.style.borderColor = isValid ? '#10b981' : '#ef4444';
      apiKeyInput.style.background = isValid ? '#f0fdf4' : '#fef2f2';
    } else {
      apiKeyInput.style.borderColor = '#e2e8f0';
      apiKeyInput.style.background = '#fafbfc';
    }
  }

  updateUI() {
    document.getElementById('apiKey').value = this.settings.apiKey;
    document.getElementById('modelSelect').value = this.settings.model;
    document.getElementById('useCustomPrompt').checked = this.settings.useCustomPrompt;
    document.getElementById('customPrompt').value = this.settings.customPrompt;
    this.toggleCustomPrompt(this.settings.useCustomPrompt);
    
    // Validate API key on load
    if (this.settings.apiKey) {
      this.validateApiKey(this.settings.apiKey);
    }
  }

  toggleCustomPrompt(show) {
    const textarea = document.getElementById('customPrompt');
    const section = textarea.closest('.section');
    
    if (show) {
      textarea.style.display = 'block';
      textarea.style.animation = 'slideIn 0.3s ease';
      setTimeout(() => textarea.focus(), 100);
    } else {
      textarea.style.display = 'none';
    }
  }

  async scanPageImages() {
    const scanBtn = document.getElementById('scanBtn');
    const originalText = scanBtn.innerHTML;
    
    if (!this.settings.apiKey) {
      this.showNotification('🔑 Please add your API key first', 'warning');
      document.getElementById('apiKey').focus();
      return;
    }

    try {
      scanBtn.classList.add('loading');
      scanBtn.disabled = true;
      scanBtn.innerHTML = '🔍 Scanning...';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Send message to start scanning
      await chrome.tabs.sendMessage(tab.id, { 
        action: 'scanImages',
        settings: this.settings
      });

      this.showNotification('🚀 Scanning images on this page...', 'info');
      
      // Auto-refresh results after a delay
      setTimeout(() => {
        this.loadResults();
      }, 3000);
      
      // Close popup after starting scan
      setTimeout(() => {
        window.close();
      }, 1500);
      
    } catch (error) {
      console.error('Error scanning page:', error);
      this.showNotification('❌ Error scanning page. Make sure you\'re on a valid webpage.', 'error');
    } finally {
      scanBtn.innerHTML = originalText;
      scanBtn.classList.remove('loading');
      scanBtn.disabled = false;
    }
  }

  async loadResults() {
    try {
      const result = await chrome.storage.local.get(['promptResults']);
      const results = result.promptResults || [];
      
      if (results.length > 0) {
        document.getElementById('results').style.display = 'block';
        this.displayResults(results.slice(0, 5)); // Show last 5 results
      } else {
        document.getElementById('results').style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  }

  displayResults(results) {
    const container = document.getElementById('resultsList');
    container.innerHTML = '';

    results.forEach((result, index) => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.style.animationDelay = `${index * 0.1}s`;
      
      const timeAgo = this.getTimeAgo(new Date(result.timestamp));
      const shortUrl = this.truncateUrl(result.imageUrl, 40);
      const shortPrompt = this.truncateText(result.prompt, 80);
      
      item.innerHTML = `
        <div><strong>🖼️ Image:</strong> ${shortUrl}</div>
        <div><strong>✨ Prompt:</strong> ${shortPrompt}</div>
        <div><strong>⏰ Time:</strong> ${timeAgo}</div>
      `;
      
      // Add click to copy functionality
      item.addEventListener('click', () => {
        navigator.clipboard.writeText(result.prompt).then(() => {
          this.showNotification('📋 Prompt copied to clipboard!', 'success');
          item.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
          setTimeout(() => {
            item.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
          }, 1000);
        });
      });
      
      item.style.cursor = 'pointer';
      item.title = 'Click to copy prompt';
      
      container.appendChild(item);
    });
  }

  truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    const start = url.substring(0, 20);
    const end = url.substring(url.length - 15);
    return `${start}...${end}`;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  async clearResults() {
    if (!confirm('🗑️ Are you sure you want to clear all results?')) {
      return;
    }

    try {
      await chrome.storage.local.remove(['promptResults']);
      document.getElementById('results').style.display = 'none';
      this.showNotification('🧹 Results cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing results:', error);
      this.showNotification('❌ Error clearing results', 'error');
    }
  }

  showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add close button for mobile
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 12px;
      background: none;
      border: none;
      color: inherit;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    notification.style.position = 'relative';
    notification.style.paddingRight = '40px';
    notification.appendChild(closeBtn);
    
    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    const autoRemove = setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);

    // Manual close
    closeBtn.addEventListener('click', () => {
      clearTimeout(autoRemove);
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    });

    // Add slide out animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideOut {
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      @media (max-width: 480px) {
        @keyframes slideOut {
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize popup with error handling
document.addEventListener('DOMContentLoaded', () => {
  try {
    new PromptSnapPopup();
  } catch (error) {
    console.error('Error initializing PromptSnap:', error);
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #ef4444;">
        <h2>❌ Error</h2>
        <p>Failed to initialize PromptSnap. Please try refreshing the extension.</p>
      </div>
    `;
  }
});