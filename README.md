# PromptSnap Chrome Extension

PromptSnap is a powerful Chrome extension that transforms images into detailed AI prompts using Google's Gemini AI. Perfect for content creators, designers, and AI enthusiasts who want to generate high-quality prompts from visual content.

## Features

### 🎯 Core Functionality
- **Image Analysis**: Convert any image into detailed AI prompts using Gemini AI
- **Batch Processing**: Analyze multiple images simultaneously
- **Page Scanning**: Scan entire web pages for images and analyze them in bulk
- **Context Menu Integration**: Right-click any image to analyze it instantly

### ⚙️ Advanced Configuration
- **Multiple API Keys**: Load balance across multiple Gemini API keys
- **Model Selection**: Choose between different Gemini models (1.5 Flash, 1.5 Pro, 2.0 Flash Lite)
- **Custom Prompts**: Use your own custom prompts for specific use cases
- **Performance Settings**: Configure parallel requests and rate limiting

### 📊 Results Management
- **Results Dashboard**: View all generated prompts in a beautiful interface
- **Export Options**: Download individual prompts or export all results
- **Copy to Clipboard**: One-click copying of generated prompts
- **Persistent Storage**: All results are saved locally in your browser

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "PromptSnap"
3. Click "Add to Chrome"

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The PromptSnap icon should appear in your toolbar

## Setup

### 1. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 2. Configure Extension
1. Click the PromptSnap icon in your toolbar
2. Add your Gemini API key in the "Gemini API Keys" section
3. Choose your preferred model (Gemini 2.0 Flash Lite recommended)
4. Configure other settings as needed
5. Click "Save Settings"

## Usage

### Scan Page Images
1. Navigate to any webpage with images
2. Click the PromptSnap icon
3. Click "Scan Page Images"
4. Select the images you want to analyze
5. Click "Analyze Selected"

### Context Menu
1. Right-click on any image
2. Select "Analyze with PromptSnap"
3. The prompt will be generated automatically

### View Results
1. Click the PromptSnap icon
2. Click "View Results"
3. Browse, copy, or download your generated prompts

## Configuration Options

### API Keys
- Add multiple Gemini API keys for load balancing
- Keys are stored securely in Chrome's sync storage
- Automatic failover if one key reaches rate limits

### Model Selection
- **Gemini 1.5 Flash**: Fast and efficient for most use cases
- **Gemini 1.5 Pro**: Higher quality analysis for complex images
- **Gemini 2.0 Flash Lite**: Latest model with improved performance

### Custom Prompts
Enable custom prompts to tailor the analysis for specific use cases:
- Art style analysis
- Technical specifications
- Marketing descriptions
- Creative interpretations

### Performance Settings
- **Parallel Requests**: Control how many images are analyzed simultaneously
- **Rate Limiting**: Prevent API rate limit errors

## Privacy & Security

- All API keys are stored locally in Chrome's secure storage
- No data is sent to external servers except Google's Gemini API
- Images are processed client-side before being sent to Gemini
- Results are stored locally in your browser

## Troubleshooting

### Common Issues

**"No API keys configured" error**
- Make sure you've added at least one valid Gemini API key
- Check that the API key is correctly formatted
- Verify the API key is active in Google AI Studio

**Images not being detected**
- The extension only detects images larger than 100x100 pixels
- Make sure images are fully loaded before scanning
- Some images may be blocked by CORS policies

**Analysis fails**
- Check your internet connection
- Verify your API key hasn't reached rate limits
- Try using a different Gemini model

### Support
If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key is working in Google AI Studio
3. Try refreshing the page and scanning again

## Development

### Project Structure
```
promptsnap/
├── manifest.json          # Extension manifest
├── popup.html            # Main popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── content.js            # Content script for page scanning
├── results.html          # Results dashboard
├── results.css           # Results page styles
├── results.js            # Results page functionality
└── icons/                # Extension icons
```

### Building
The extension is built with vanilla JavaScript, HTML, and CSS. No build process is required.

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### Version 1.0.0
- Initial release
- Basic image analysis functionality
- Page scanning feature
- Results dashboard
- Multiple API key support
- Custom prompt configuration