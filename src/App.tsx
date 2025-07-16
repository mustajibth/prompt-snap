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

    setAnalyses(prev => [...newAnalyses, ...prev]);
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

    setAnalyses(prev => [...newAnalyses, ...prev]);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 max-w-md mx-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50 max-w-md mx-auto">
        <div className="px-4 py-4">
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


            {/* Mobile Header - Status Only */}
            {analyses.length > 0 && (
              <div className="text-sm text-gray-600">
                {completedCount}/{analyses.length}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pt-20 pb-24">
        {/* API Key Warning */}
        {!import.meta.env.VITE_GEMINI_API_KEY && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-2 text-sm">Gemini API Key Required</h3>
                <p className="text-amber-700 mb-3 text-sm">
                  To use PromptSnap, you need to configure your Gemini API key. 
                </p>
                <p className="text-amber-700 text-xs mt-2">
                  Get your API key from the <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>.
                  Or use the API Key Manager below to add keys.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {analyses.length === 0 ? (
          <div className="text-center py-8">
            <UploadArea onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
          </div>
        ) : (
          <div className="mb-6">
            <UploadArea onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
          </div>
        )}

        {/* Results Grid */}
        {analyses.length > 0 && (
          <div className="space-y-4">
            {analyses.map(analysis => (
              <PromptCard 
                key={analysis.id} 
                analysis={analysis} 
                onRegeneratePrompt={handleRegeneratePrompt}
              />
            ))}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          {/* Left side - Action buttons */}
          <div className="flex items-center space-x-3">
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