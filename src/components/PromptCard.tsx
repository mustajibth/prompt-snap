import React, { useState } from 'react';
import { Copy, Check, AlertCircle, Loader, Palette, Download, RefreshCw, Zap } from 'lucide-react';
import { ImageAnalysis, PromptVariation } from '../types';
import { getPromptVariations } from '../utils/gemini';

interface PromptCardProps {
  analysis: ImageAnalysis;
  onRegeneratePrompt?: (id: string, variation: string) => void;
}

export default function PromptCard({ analysis, onRegeneratePrompt }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<string>('creative');
  const [showVariations, setShowVariations] = useState(false);
  const [showPromptAnalysis, setShowPromptAnalysis] = useState(false);

  const variations = getPromptVariations();

  const handleCopyPrompt = async () => {
    if (analysis.prompt) {
      try {
        await navigator.clipboard.writeText(analysis.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy prompt:', error);
      }
    }
  };

  const handleDownloadPrompt = () => {
    if (!analysis.prompt) return;
    
    const content = `PromptSnap - Generated AI Prompt
File: ${analysis.file.name}
Generated: ${new Date().toLocaleString()}
Variation: ${selectedVariation}
Source: ${analysis.source || 'upload'}
Image Size: ${(analysis.file.size / 1024 / 1024).toFixed(2)} MB

=== GENERATED PROMPT ===
${analysis.prompt}

=== PROMPT ANALYSIS ===
Length: ${analysis.prompt.length} characters
Word Count: ${analysis.prompt.split(' ').length} words
Style: ${selectedVariation}

=== USAGE TIPS ===
- Use this prompt with AI image generators like Midjourney, DALL-E, or Stable Diffusion
- You can modify specific details to customize the output
- Add style modifiers like "in the style of [artist]" for artistic variations
- Adjust quality terms like "8k", "photorealistic", or "highly detailed" as needed`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptsnap-${analysis.file.name.replace(/\.[^/.]+$/, '')}-${selectedVariation}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVariationChange = (variation: string) => {
    setSelectedVariation(variation);
    if (onRegeneratePrompt) {
      onRegeneratePrompt(analysis.id, variation);
    }
  };

  const getStatusIcon = () => {
    switch (analysis.status) {
      case 'analyzing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusText = () => {
    switch (analysis.status) {
      case 'analyzing':
        return 'Analyzing image with enhanced AI...';
      case 'completed':
        return 'High-quality prompt generated';
      case 'error':
        return analysis.error || 'Analysis failed';
      default:
        return 'Waiting in queue...';
    }
  };

  const getSourceBadge = () => {
    if (!analysis.source || analysis.source === 'upload') return null;
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
        analysis.source === 'adobe-stock' 
          ? 'bg-red-100 text-red-800' 
          : 'bg-green-100 text-green-800'
      }`}>
        {analysis.source === 'adobe-stock' ? 'Adobe Stock' : 'Vecteezy'}
      </span>
    );
  };

  const getPromptQualityScore = () => {
    if (!analysis.prompt) return null;
    
    const prompt = analysis.prompt.toLowerCase();
    let score = 0;
    
    // Check for quality indicators
    const qualityTerms = ['detailed', 'high quality', 'professional', 'sharp', 'clear', '8k', '4k', 'photorealistic'];
    const colorTerms = ['blue', 'red', 'green', 'golden', 'crimson', 'azure', 'emerald'];
    const lightingTerms = ['lighting', 'illuminated', 'shadows', 'bright', 'dark', 'soft light', 'dramatic'];
    const compositionTerms = ['composition', 'framing', 'perspective', 'angle', 'close-up', 'wide shot'];
    
    if (qualityTerms.some(term => prompt.includes(term))) score += 25;
    if (colorTerms.some(term => prompt.includes(term))) score += 20;
    if (lightingTerms.some(term => prompt.includes(term))) score += 25;
    if (compositionTerms.some(term => prompt.includes(term))) score += 20;
    if (analysis.prompt.length > 200) score += 10;
    
    return Math.min(score, 100);
  };

  const qualityScore = getPromptQualityScore();

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Image Preview */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <img
          src={analysis.preview}
          alt={`Upload ${analysis.id}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Status Overlay */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-xs font-medium text-gray-700">
            {analysis.status === 'analyzing' ? 'Analyzing...' : 
             analysis.status === 'completed' ? 'Ready' :
             analysis.status === 'error' ? 'Error' : 'Pending'}
          </span>
        </div>

        {/* Source Badge */}
        {getSourceBadge() && (
          <div className="absolute top-3 left-3">
            {getSourceBadge()}
          </div>
        )}

        {/* Quality Score */}
        {qualityScore && (
          <div className="absolute bottom-3 left-3">
            <div className={`px-2 py-1 text-xs rounded-full font-medium ${
              qualityScore >= 80 ? 'bg-green-100 text-green-800' :
              qualityScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              Quality: {qualityScore}%
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 truncate flex-1">
            {analysis.file.name}
          </h3>
          <span className="text-xs text-gray-500 ml-2">
            {(analysis.file.size / 1024 / 1024).toFixed(1)} MB
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${
              analysis.status === 'completed' ? 'bg-green-500 w-full' :
              analysis.status === 'analyzing' ? 'bg-blue-500 w-3/4 animate-pulse' :
              analysis.status === 'error' ? 'bg-red-500 w-full' :
              'bg-gray-400 w-1/4'
            }`} />
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {getStatusText()}
        </p>

        {/* Enhanced Prompt Variations */}
        {analysis.status === 'completed' && onRegeneratePrompt && (
          <div className="mb-4">
            <button
              onClick={() => setShowVariations(!showVariations)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium mb-2"
            >
              <Palette className="w-4 h-4" />
              <span>Prompt Variations</span>
              <Zap className="w-3 h-3" />
            </button>
            
            {showVariations && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {variations.map((variation) => (
                    <button
                      key={variation.style}
                      onClick={() => handleVariationChange(variation.style)}
                      className={`p-3 text-xs rounded-lg border transition-all duration-200 ${
                        selectedVariation === variation.style
                          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium capitalize mb-1">{variation.style}</div>
                      <div className="text-xs opacity-75 leading-tight">{variation.description}</div>
                    </button>
                  ))}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-blue-700 text-xs font-medium mb-1">
                    <Zap className="w-3 h-3" />
                    <span>Enhanced AI Analysis</span>
                  </div>
                  <p className="text-blue-600 text-xs">
                    Each variation uses advanced prompting techniques for maximum accuracy and detail.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompt Display with Analysis */}
        {analysis.status === 'completed' && analysis.prompt && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Generated Prompt</span>
                <button
                  onClick={() => setShowPromptAnalysis(!showPromptAnalysis)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showPromptAnalysis ? 'Hide Analysis' : 'Show Analysis'}
                </button>
              </div>
              
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                {analysis.prompt}
              </p>
              
              {showPromptAnalysis && (
                <div className="border-t pt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-gray-600">Length:</span>
                      <span className="ml-1 text-gray-700">{analysis.prompt.length} chars</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Words:</span>
                      <span className="ml-1 text-gray-700">{analysis.prompt.split(' ').length}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Style:</span>
                      <span className="ml-1 text-gray-700 capitalize">{selectedVariation}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Quality:</span>
                      <span className={`ml-1 font-medium ${
                        qualityScore >= 80 ? 'text-green-600' :
                        qualityScore >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {qualityScore}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleCopyPrompt}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-md'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleDownloadPrompt}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                title="Download detailed prompt file"
              >
                <Download className="w-4 h-4" />
              </button>

              {onRegeneratePrompt && (
                <button
                  onClick={() => handleVariationChange(selectedVariation)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  title="Regenerate with enhanced AI"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {analysis.status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">
                {analysis.error || 'Failed to analyze image'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}