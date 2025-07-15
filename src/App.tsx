import React, { useState, useCallback } from 'react';
import { Download, Zap, FileText, AlertTriangle, Settings, Globe, Key } from 'lucide-react';
import UploadArea from './components/UploadArea';
import PromptCard from './components/PromptCard';
import APIKeyManager from './components/APIKeyManager';
import ScrapingModal from './components/ScrapingModal';
import { ImageAnalysis, ScrapedImage } from './types';
import { analyzeImageWithGemini, analyzeImageFromUrl } from './utils/gemini';

function App() {
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAPIKeyManager, setShowAPIKeyManager] = useState(false);
  const [showScrapingModal, setShowScrapingModal] = useState(false);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const newAnalyses: ImageAnalysis[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      source: 'upload'
    }));

    setAnalyses(prev => [...prev, ...newAnalyses]);
    setIsProcessing(true);

    // Process each image
    for (const analysis of newAnalyses) {
      try {
        // Update status to analyzing
        setAnalyses(prev => prev.map(a => 
          a.id === analysis.id ? { ...a, status: 'analyzing' } : a
        ));

        const prompt = await analyzeImageWithGemini(analysis.file, 'creative');

        // Update with completed status and prompt
        setAnalyses(prev => prev.map(a => 
          a.id === analysis.id ? { ...a, status: 'completed', prompt } : a
        ));
      } catch (error) {
        console.error('Error analyzing image:', error);
        
        // Update with error status
        setAnalyses(prev => prev.map(a => 
          a.id === analysis.id ? { 
            ...a, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          } : a
        ));
      }
    }

    setIsProcessing(false);
  }, []);

  const handleScrapedImagesSelected = useCallback(async (scrapedImages: ScrapedImage[]) => {
    const newAnalyses: ImageAnalysis[] = [];

    for (const scrapedImage of scrapedImages) {
      try {
        // Create a temporary file object from the scraped image
        const response = await fetch(scrapedImage.thumbnail);
        const blob = await response.blob();
        const file = new File([blob], `${scrapedImage.title}.jpg`, { type: 'image/jpeg' });

        const analysis: ImageAnalysis = {
          id: crypto.randomUUID(),
          file,
          preview: scrapedImage.thumbnail,
          status: 'pending',
          source: scrapedImage.source,
          originalUrl: scrapedImage.url
        };

        newAnalyses.push(analysis);
      } catch (error) {
        console.error('Error processing scraped image:', error);
      }
    }

    setAnalyses(prev => [...prev, ...newAnalyses]);
    setIsProcessing(true);

    // Process each scraped image
    for (const analysis of newAnalyses) {
      try {
        // Update status to analyzing
        setAnalyses(prev => prev.map(a => 
          a.id === analysis.id ? { ...a, status: 'analyzing' } : a
        ));

        const prompt = await analyzeImageFromUrl(analysis.preview, 'creative');

        // Update with completed status and prompt
        setAnalyses(prev => prev.map(a => 
          a.id === analysis.id ? { ...a, status: 'completed', prompt } : a
        ));
      } catch (error) {
        console.error('Error analyzing scraped image:', error);
        
        // Update with error status
        setAnalyses(prev => prev.map(a => 
          a.id === analysis.id ? { 
            ...a, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          } : a
        ));
      }
    }

    setIsProcessing(false);
  }, []);

  const handleRegeneratePrompt = useCallback(async (analysisId: string, variation: string) => {
    const analysis = analyses.find(a => a.id === analysisId);
    if (!analysis) return;

    // Update status to analyzing
    setAnalyses(prev => prev.map(a => 
      a.id === analysisId ? { ...a, status: 'analyzing' } : a
    ));

    try {
      const prompt = analysis.source === 'upload' 
        ? await analyzeImageWithGemini(analysis.file, variation as any)
        : await analyzeImageFromUrl(analysis.preview, variation as any);

      // Update with new prompt
      setAnalyses(prev => prev.map(a => 
        a.id === analysisId ? { ...a, status: 'completed', prompt } : a
      ));
    } catch (error) {
      console.error('Error regenerating prompt:', error);
      
      // Update with error status
      setAnalyses(prev => prev.map(a => 
        a.id === analysisId ? { 
          ...a, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        } : a
      ));
    }
  }, [analyses]);

  const handleDownloadAll = useCallback(() => {
    const completedAnalyses = analyses.filter(a => a.status === 'completed' && a.prompt);
    
    if (completedAnalyses.length === 0) {
      return;
    }

    const content = completedAnalyses.map((analysis, index) => {
      const timestamp = new Date().toLocaleString();
      return `
=== PROMPT ${index + 1} ===
File: ${analysis.file.name}
Source: ${analysis.source || 'upload'}
Generated: ${timestamp}
${analysis.originalUrl ? `Original URL: ${analysis.originalUrl}` : ''}

${analysis.prompt}

${'='.repeat(50)}
      `.trim();
    }).join('\n\n');

    const finalContent = `PromptSnap - Generated AI Prompts
Generated on: ${new Date().toLocaleString()}
Total prompts: ${completedAnalyses.length}

${'='.repeat(50)}

${content}`;

    const blob = new Blob([finalContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptsnap-prompts-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [analyses]);

  const clearAll = useCallback(() => {
    // Clean up object URLs
    analyses.forEach(analysis => {
      URL.revokeObjectURL(analysis.preview);
    });
    setAnalyses([]);
  }, [analyses]);

  const completedCount = analyses.filter(a => a.status === 'completed').length;
  const processingCount = analyses.filter(a => a.status === 'analyzing').length;
  const errorCount = analyses.filter(a => a.status === 'error').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PromptSnap</h1>
                <p className="text-gray-600 text-sm">by Ajibid Studio</p>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setShowAPIKeyManager(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors duration-200"
                title="Manage API Keys"
              >
                <Key className="w-4 h-4" />
                <span>API Keys</span>
              </button>

              {analyses.length > 0 && (
                <>
                  <div className="text-sm text-gray-600">
                    {completedCount} completed • {processingCount} processing • {errorCount} errors
                  </div>
                  
                  {completedCount > 0 && (
                    <button
                      onClick={handleDownloadAll}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
                      title="Download All Prompts"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download All</span>
                    </button>
                  )}

                  <button
                    onClick={clearAll}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg font-medium transition-colors duration-200"
                    title="Clear All Results"
                  >
                    Clear All
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* API Key Warning */}
        {!import.meta.env.VITE_GEMINI_API_KEY && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">Gemini API Key Required</h3>
                <p className="text-amber-700 mb-3">
                  To use PromptSnap, you need to configure your Gemini API key. 
                  Create a <code className="bg-amber-100 px-2 py-1 rounded">.env</code> file 
                  in your project root and add:
                </p>
                <code className="block bg-amber-100 p-3 rounded-lg text-sm font-mono text-amber-800">
                  VITE_GEMINI_API_KEY=your_api_key_here
                </code>
                <p className="text-amber-700 text-sm mt-2">
                  Get your API key from the <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>.
                  Or use the API Key Manager above to add multiple keys.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Grid - Moved Above Upload Area */}
        {analyses.length > 0 && (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Generated Prompts</h2>
              <p className="text-gray-600 text-sm">
                {completedCount} completed • {processingCount} processing • {errorCount} errors
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.map(analysis => (
                <PromptCard 
                  key={analysis.id} 
                  analysis={analysis} 
                  onRegeneratePrompt={handleRegeneratePrompt}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Upload Images</h2>
            <p className="text-gray-600 text-sm">
              Upload your images to generate AI prompts
            </p>
          </div>
          <UploadArea onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
        </div>

        {/* Enhanced Features - Only show when no results */}
        {analyses.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Enhanced Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">Batch Processing</h3>
                  <p className="text-gray-600 text-sm">
                    Upload multiple images and process them all at once
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Key className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">Multi API Keys</h3>
                  <p className="text-gray-600 text-sm">
                    Load balance across multiple Gemini API keys
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">Prompt Variations</h3>
                  <p className="text-gray-600 text-sm">
                    Generate creative, technical, artistic, or commercial prompts
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Download className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">Export Results</h3>
                  <p className="text-gray-600 text-sm">
                    Download individual prompts or export all results
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
        <div className="flex items-center justify-between">
          {/* Left side - Action buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowScrapingModal(true)}
              className="flex flex-col items-center justify-center p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 min-w-[60px]"
              title="Search Stock Images"
            >
              <Globe className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Search</span>
            </button>

            <button
              onClick={() => setShowAPIKeyManager(true)}
              className="flex flex-col items-center justify-center p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-200 min-w-[60px]"
              title="Manage API Keys"
            >
              <Key className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">API Keys</span>
            </button>

            {completedCount > 0 && (
              <button
                onClick={handleDownloadAll}
                className="flex flex-col items-center justify-center p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 min-w-[60px]"
                title="Download All Prompts"
              >
                <Download className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Download</span>
              </button>
            )}
          </div>

          {/* Right side - Status and Clear */}
          <div className="flex items-center space-x-3">
            {analyses.length > 0 && (
              <>
                <div className="text-center">
                  <div className="text-xs text-gray-600 font-medium">
                    {completedCount}/{analyses.length}
                  </div>
                  <div className="text-xs text-gray-500">completed</div>
                </div>
                
                <button
                  onClick={clearAll}
                  className="flex flex-col items-center justify-center p-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 min-w-[60px]"
                  title="Clear All Results"
                >
                  <Settings className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Clear</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <APIKeyManager 
        isOpen={showAPIKeyManager} 
        onClose={() => setShowAPIKeyManager(false)} 
      />
      
      <ScrapingModal 
        isOpen={showScrapingModal} 
        onClose={() => setShowScrapingModal(false)} 
        onImagesSelected={handleScrapedImagesSelected}
      />
    </div>
  );
}

export default App;