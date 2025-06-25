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
    try {
      await chrome.storage.sync.set(this.settings);
      this.showNotification('Settings saved!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showNotification('Error saving settings', 'error');
    }
  }

  setupEventListeners() {
    // API Key toggle
    document.getElementById('toggleKey').addEventListener('click', () => {
      const input = document.getElementById('apiKey');
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Settings inputs
    document.getElementById('apiKey').addEventListener('input', (e) => {
      this.settings.apiKey = e.target.value;
    });

    document.getElementById('modelSelect').addEventListener('change', (e) => {
      this.settings.model = e.target.value;
    });

    document.getElementById('useCustomPrompt').addEventListener('change', (e) => {
      this.settings.useCustomPrompt = e.target.checked;
      this.toggleCustomPrompt(e.target.checked);
    });

    document.getElementById('customPrompt').addEventListener('input', (e) => {
      this.settings.customPrompt = e.target.value;
    });

    // Action buttons
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('scanBtn').addEventListener('click', () => {
      this.scanPageImages();
    });

    document.getElementById('clearResults').addEventListener('click', () => {
      this.clearResults();
    });
  }

  updateUI() {
    document.getElementById('apiKey').value = this.settings.apiKey;
    document.getElementById('modelSelect').value = this.settings.model;
    document.getElementById('useCustomPrompt').checked = this.settings.useCustomPrompt;
    document.getElementById('customPrompt').value = this.settings.customPrompt;
    this.toggleCustomPrompt(this.settings.useCustomPrompt);
  }

  toggleCustomPrompt(show) {
    const textarea = document.getElementById('customPrompt');
    textarea.style.display = show ? 'block' : 'none';
  }

  async scanPageImages() {
    if (!this.settings.apiKey) {
      this.showNotification('Please add your API key first', 'error');
      return;
    }

    try {
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

      this.showNotification('Scanning images...', 'success');
      window.close();
    } catch (error) {
      console.error('Error scanning page:', error);
      this.showNotification('Error scanning page', 'error');
    }
  }

  async loadResults() {
    try {
      const result = await chrome.storage.local.get(['promptResults']);
      const results = result.promptResults || [];
      
      if (results.length > 0) {
        document.getElementById('results').style.display = 'block';
        this.displayResults(results.slice(0, 5)); // Show last 5 results
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  }

  displayResults(results) {
    const container = document.getElementById('resultsList');
    container.innerHTML = '';

    results.forEach(result => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.innerHTML = `
        <div><strong>Image:</strong> ${result.imageUrl.substring(0, 50)}...</div>
        <div><strong>Prompt:</strong> ${result.prompt.substring(0, 100)}...</div>
        <div><strong>Time:</strong> ${new Date(result.timestamp).toLocaleString()}</div>
      `;
      container.appendChild(item);
    });
  }

  async clearResults() {
    try {
      await chrome.storage.local.remove(['promptResults']);
      document.getElementById('results').style.display = 'none';
      this.showNotification('Results cleared', 'success');
    } catch (error) {
      console.error('Error clearing results:', error);
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  new PromptSnapPopup();
});