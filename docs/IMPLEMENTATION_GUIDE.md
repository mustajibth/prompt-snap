# Adobe Stock Integration Implementation Guide

## 🚀 Real Solutions for Adobe Stock Integration

### Problem
The current implementation uses demo mode with placeholder images because of CORS restrictions and Adobe Stock's terms of service. Here are **6 real solutions** to implement actual Adobe Stock integration:

---

## 🔧 Solution 1: Browser Extension (Recommended)

### Why This Works
- No CORS restrictions
- Direct access to page content
- Best user experience

### Implementation Steps

1. **Create Chrome Extension Manifest**
```json
{
  "manifest_version": 3,
  "name": "PromptSnap Adobe Stock Extractor",
  "permissions": ["activeTab", "scripting"],
  "content_scripts": [{
    "matches": ["*://stock.adobe.com/*"],
    "js": ["content-script.js"]
  }]
}
```

2. **Content Script for Adobe Stock**
```javascript
// content-script.js
function extractAdobeStockImages() {
  const images = [];
  const imageElements = document.querySelectorAll('[data-testid="asset-thumbnail"], .asset-item img');
  
  imageElements.forEach((element, index) => {
    const img = element.tagName === 'IMG' ? element : element.querySelector('img');
    if (img && img.src) {
      images.push({
        url: window.location.href + '#image-' + index,
        title: img.alt || `Adobe Stock Image ${index + 1}`,
        source: 'adobe-stock',
        thumbnail: img.src
      });
    }
  });
  
  return images;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractAdobeImages') {
    const images = extractAdobeStockImages();
    sendResponse({ images });
  }
});
```

3. **Integration with React App**
```typescript
// Use the AdobeStockExtensionScraper class from the updated code
const images = await AdobeStockExtensionScraper.extractImagesFromCurrentTab();
```

---

## 🔧 Solution 2: Official Adobe Stock API

### Why This Works
- Official, legal, and reliable
- High rate limits
- Best image quality and metadata

### Implementation Steps

1. **Get Adobe Stock API Key**
   - Visit [Adobe Developer Console](https://developer.adobe.com/)
   - Create new project
   - Add Adobe Stock API
   - Get API key and secret

2. **Environment Setup**
```bash
# .env
VITE_ADOBE_API_KEY=your_adobe_api_key
VITE_ADOBE_API_SECRET=your_adobe_api_secret
```

3. **API Integration**
```typescript
// Already implemented in AdobeStockAPIService class
const images = await AdobeStockAPIService.searchImages('landscape', 50);
```

4. **API Endpoints**
```
Search: https://stock.adobe.io/Rest/Media/1/Search/Files
License: https://stock.adobe.io/Rest/Libraries/1/Content/License
```

---

## 🔧 Solution 3: Backend Proxy Service

### Why This Works
- Bypasses CORS completely
- Can handle authentication
- Scalable solution

### Implementation Steps

1. **Create Express.js Backend**
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/adobe-stock/extract', async (req, res) => {
  try {
    const { url, count } = req.body;
    
    // Fetch Adobe Stock page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PromptSnap/1.0)'
      }
    });
    
    // Parse HTML and extract images
    const images = parseAdobeStockHTML(response.data, count);
    
    res.json({ images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function parseAdobeStockHTML(html, count) {
  // Implementation for parsing Adobe Stock HTML
  // Use cheerio or similar library
}

app.listen(3001);
```

2. **Deploy to Vercel/Netlify**
```bash
npm install express cors axios cheerio
vercel deploy
```

3. **Update Frontend**
```typescript
// Use AdobeStockProxyService class
const images = await AdobeStockProxyService.extractImages(url, count);
```

---

## 🔧 Solution 4: Puppeteer Headless Browser

### Why This Works
- Handles JavaScript-rendered content
- Most reliable scraping method
- Can simulate user interactions

### Implementation Steps

1. **Create Puppeteer Service**
```javascript
// puppeteer-service.js
const puppeteer = require('puppeteer');

async function scrapeAdobeStock(url, imageCount) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Wait for images to load
  await page.waitForSelector('[data-testid="asset-thumbnail"]', { timeout: 10000 });
  
  // Extract image data
  const images = await page.evaluate((count) => {
    const imageElements = document.querySelectorAll('[data-testid="asset-thumbnail"]');
    const results = [];
    
    for (let i = 0; i < Math.min(imageElements.length, count); i++) {
      const element = imageElements[i];
      const img = element.querySelector('img');
      const titleElement = element.querySelector('[data-testid="asset-title"]');
      
      if (img) {
        results.push({
          url: `https://stock.adobe.com/image/${i + 1}`,
          title: titleElement?.textContent || `Adobe Stock Image ${i + 1}`,
          source: 'adobe-stock',
          thumbnail: img.src
        });
      }
    }
    
    return results;
  }, imageCount);
  
  await browser.close();
  return images;
}

module.exports = { scrapeAdobeStock };
```

2. **API Endpoint**
```javascript
app.post('/api/scrape/adobe-stock', async (req, res) => {
  const { url, imageCount } = req.body;
  const images = await scrapeAdobeStock(url, imageCount);
  res.json({ images });
});
```

---

## 🔧 Solution 5: CORS Proxy with HTML Parsing

### Why This Works
- Quick implementation
- No backend required
- Uses public proxy services

### Implementation Steps

1. **Use Public CORS Proxy**
```typescript
// Already implemented in CORSProxyService class
const images = await CORSProxyService.extractImagesWithCORS(adobeUrl);
```

2. **Alternative Proxies**
```typescript
const proxies = [
  'https://api.allorigins.win/get?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://thingproxy.freeboard.io/fetch/'
];
```

---

## 🔧 Solution 6: Electron Desktop App

### Why This Works
- No CORS restrictions
- Full browser capabilities
- Can access local files

### Implementation Steps

1. **Create Electron App**
```javascript
// main.js
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Disables CORS
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
```

2. **Package with React**
```bash
npm install electron electron-builder
npm run build
npm run electron
```

---

## 📋 Implementation Recommendations

### For Production Use:
1. **Adobe Stock API** (Best legal compliance)
2. **Browser Extension** (Best user experience)
3. **Backend Proxy** (Most scalable)

### For Development/Testing:
1. **CORS Proxy** (Quick setup)
2. **Demo Mode** (Current implementation)

### For Enterprise:
1. **Puppeteer Service** (Most reliable)
2. **Electron App** (Full control)

---

## ⚖️ Legal Considerations

1. **Adobe Stock Terms of Service**
   - Read and comply with Adobe's ToS
   - Respect rate limits
   - Don't redistribute copyrighted content

2. **API Usage**
   - Use official APIs when available
   - Implement proper attribution
   - Handle licensing correctly

3. **Scraping Ethics**
   - Respect robots.txt
   - Implement reasonable delays
   - Don't overload servers

---

## 🚀 Quick Start Guide

1. **Choose your solution** based on requirements
2. **Set up environment variables** for API keys
3. **Update the extraction method** in the component
4. **Test with small batches** first
5. **Implement error handling** and retries
6. **Add rate limiting** to respect service limits

The current implementation provides a solid foundation with multiple extraction methods. Choose the one that best fits your use case and technical requirements.