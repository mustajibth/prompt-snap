class PromptSnapResults {
  constructor() {
    this.results = [];
    this.init();
  }

  async init() {
    await this.loadResults();
    this.setupEventListeners();
    this.renderResults();
  }

  async loadResults() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getResults' });
      if (response.success) {
        this.results = response.results;
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  }

  setupEventListeners() {
    document.getElementById('clearAllBtn').addEventListener('click', () => {
      this.clearAllResults();
    });

    document.getElementById('exportAllBtn').addEventListener('click', () => {
      this.exportAllResults();
    });
  }

  renderResults() {
    const container = document.getElementById('resultsContainer');
    const loading = document.getElementById('loading');
    
    loading.style.display = 'none';

    if (this.results.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'results-grid';

    this.results.forEach(result => {
      const card = this.createResultCard(result);
      grid.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(grid);
  }

  createResultCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const timestamp = new Date(result.timestamp).toLocaleString();
    
    card.innerHTML = `
      <img src="${result.imageUrl}" alt="${result.alt || 'Generated prompt'}" class="result-image" loading="lazy">
      <div class="result-content">
        <div class="result-meta">
          <span class="result-source">${this.getSourceLabel(result.source)}</span>
          <span class="result-timestamp">${timestamp}</span>
        </div>
        <div class="result-prompt">${result.prompt}</div>
        <div class="result-actions">
          <button class="action-btn copy-btn" data-prompt="${encodeURIComponent(result.prompt)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </button>
          <button class="action-btn download-btn" data-result='${JSON.stringify(result)}'>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const copyBtn = card.querySelector('.copy-btn');
    const downloadBtn = card.querySelector('.download-btn');

    copyBtn.addEventListener('click', () => {
      this.copyPrompt(copyBtn);
    });

    downloadBtn.addEventListener('click', () => {
      this.downloadResult(result);
    });

    return card;
  }

  getSourceLabel(source) {
    switch (source) {
      case 'page-scan':
        return 'Page Scan';
      case 'context-menu':
        return 'Context Menu';
      case 'upload':
        return 'Upload';
      default:
        return 'Unknown';
    }
  }

  async copyPrompt(button) {
    const prompt = decodeURIComponent(button.dataset.prompt);
    
    try {
      await navigator.clipboard.writeText(prompt);
      
      const originalText = button.innerHTML;
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
        Copied!
      `;
      button.classList.add('copied');
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('copied');
      }, 2000);
    } catch (error) {
      console.error('Error copying prompt:', error);
    }
  }

  downloadResult(result) {
    const content = `PromptSnap - Generated AI Prompt
Generated: ${new Date(result.timestamp).toLocaleString()}
Source: ${this.getSourceLabel(result.source)}
Image URL: ${result.imageUrl}

${result.prompt}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptsnap-${result.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  async clearAllResults() {
    if (!confirm('Are you sure you want to clear all results? This action cannot be undone.')) {
      return;
    }

    try {
      await chrome.runtime.sendMessage({ action: 'clearResults' });
      this.results = [];
      this.renderResults();
    } catch (error) {
      console.error('Error clearing results:', error);
    }
  }

  exportAllResults() {
    if (this.results.length === 0) {
      alert('No results to export');
      return;
    }

    const content = this.results.map((result, index) => {
      return `
=== PROMPT ${index + 1} ===
Generated: ${new Date(result.timestamp).toLocaleString()}
Source: ${this.getSourceLabel(result.source)}
Image URL: ${result.imageUrl}

${result.prompt}

${'='.repeat(50)}
      `.trim();
    }).join('\n\n');

    const finalContent = `PromptSnap - Exported Results
Export Date: ${new Date().toLocaleString()}
Total Prompts: ${this.results.length}

${'='.repeat(50)}

${content}`;

    const blob = new Blob([finalContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptsnap-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  getEmptyStateHTML() {
    return `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21,15 16,10 5,21"/>
        </svg>
        <h3>No Results Yet</h3>
        <p>Start by scanning images on web pages or using the context menu to analyze images.</p>
        <button class="btn primary" onclick="window.close()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
            <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
          </svg>
          Start Scanning
        </button>
      </div>
    `;
  }
}

// Initialize results page
document.addEventListener('DOMContentLoaded', () => {
  new PromptSnapResults();
});