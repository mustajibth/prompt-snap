import React, { useState } from 'react';
import { Copy, Check, AlertCircle, Loader, Palette, Download } from 'lucide-react';
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

${analysis.prompt}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${analysis.file.name.replace(/\.[^/.]+$/, '')}.txt`;
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
        return 'Analyzing image...';
      case 'completed':
        return 'Analysis complete';
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

        {/* Prompt Variations */}
        {analysis.status === 'completed' && onRegeneratePrompt && (
          <div className="mb-4">
            <button
              onClick={() => setShowVariations(!showVariations)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Palette className="w-4 h-4" />
              <span>Prompt Variations</span>
            </button>
            
            {showVariations && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {variations.map((variation) => (
                  <button
                    key={variation.style}
                    onClick={() => handleVariationChange(variation.style)}
                    className={`p-2 text-xs rounded-lg border transition-colors ${
                      selectedVariation === variation.style
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium capitalize">{variation.style}</div>
                    <div className="text-xs opacity-75 mt-1">{variation.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prompt Display */}
        {analysis.status === 'completed' && analysis.prompt && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <p className="text-gray-700 text-sm leading-relaxed">
                {analysis.prompt}
              </p>
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
              >
                <Download className="w-4 h-4" />
              </button>
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