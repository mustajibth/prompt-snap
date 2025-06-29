import React, { useState, useCallback } from 'react';
import { Upload, Copy, Check, AlertCircle, Loader, Download, Key, Zap } from 'lucide-react';

interface ImageAnalysis {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  prompt?: string;
  error?: string;
}

function App() {
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const analyzeImage = async (file: File): Promise<string> => {
    if (!apiKey) {
      throw new Error('Please enter your Gemini API key first');
    }

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const base64Content = base64Data.split(',')[1];

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Analyze this image and create a detailed AI prompt that could recreate this image. Be very specific about colors, lighting, composition, style, and mood. Write it as a single flowing prompt suitable for AI image generators like Midjourney or DALL-E.`
            },
            {
              inline_data: {
                mime_type: file.type,
                data: base64Content
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated');
    }

    return data.candidates[0].content.parts[0].text.trim();
  };

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const newAnalyses: ImageAnalysis[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending'
    }));

    setAnalyses(prev => [...prev, ...newAnalyses]);
    setIsProcessing(true);

    for (const analysis of newAnalyses) {
      try {
        setAnalyses(prev => prev.map(a => 
          a.id === analysis.id ? { ...a, status: 'analyzing' } : a
        ));

        const prompt = await analyzeImage(analysis.file);

        setAnalyses(prev => prev.map(a => 
          a.id === analysis.id ? { ...a, status: 'completed', prompt } : a
        ));
      } catch (error) {
        setAnalyses(prev => prev.map(a => 
          a.id === analysis.id ? { 
            ...a, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error'
          } : a
        ));
      }
    }

    setIsProcessing(false);
  }, [apiKey]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleFilesSelected(files);
    }
    e.target.value = '';
  };

  const copyPrompt = async (prompt: string, analysisId: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      // Show copied state briefly
      setAnalyses(prev => prev.map(a => 
        a.id === analysisId ? { ...a, copied: true } : a
      ));
      setTimeout(() => {
        setAnalyses(prev => prev.map(a => 
          a.id === analysisId ? { ...a, copied: false } : a
        ));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadAll = () => {
    const completedAnalyses = analyses.filter(a => a.status === 'completed' && a.prompt);
    
    if (completedAnalyses.length === 0) return;

    const content = completedAnalyses.map((analysis, index) => {
      return `=== PROMPT ${index + 1} ===
File: ${analysis.file.name}
Generated: ${new Date().toLocaleString()}

${analysis.prompt}

${'='.repeat(50)}`;
    }).join('\n\n');

    const finalContent = `PromptSnap - Generated AI Prompts
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
  };

  const clearAll = () => {
    analyses.forEach(analysis => {
      URL.revokeObjectURL(analysis.preview);
    });
    setAnalyses([]);
  };

  const completedCount = analyses.filter(a => a.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PromptSnap</h1>
                <p className="text-gray-600 text-sm">AI Image Prompt Generator</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className={`p-2 rounded-lg transition-colors ${
                  apiKey ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={apiKey ? 'API Key Configured' : 'Configure API Key'}
              >
                <Key className="w-5 h-5" />
              </button>

              {analyses.length > 0 && (
                <>
                  <span className="text-sm text-gray-600">
                    {completedCount} completed
                  </span>
                  
                  {completedCount > 0 && (
                    <button
                      onClick={downloadAll}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download All</span>
                    </button>
                  )}

                  <button
                    onClick={clearAll}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg font-medium transition-colors"
                  >
                    Clear All
                  </button>
                </>
              )}
            </div>
          </div>

          {/* API Key Input */}
          {showApiKeyInput && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Gemini API Key
              </label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key..."
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
              </div>
              <p className="text-blue-700 text-xs mt-2">
                Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener" className="underline">Google AI Studio</a>
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Upload Area */}
        {analyses.length === 0 ? (
          <div className="text-center py-16">
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload Images</h3>
              <p className="text-gray-500 mb-4">Drag and drop images here, or click to select files</p>
              
              <div className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <Upload className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-700 font-medium">Choose Files</span>
              </div>
              
              <div className="mt-6 text-sm text-gray-400">
                Supports: JPG, PNG, GIF, WebP
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Add more images</p>
            </div>
          </div>
        )}

        {/* Results */}
        {analyses.length > 0 && (
          <div className="space-y-6">
            {analyses.map(analysis => (
              <div key={analysis.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="md:flex">
                  {/* Image Preview */}
                  <div className="md:w-1/3">
                    <div className="aspect-video md:aspect-square bg-gray-100">
                      <img
                        src={analysis.preview}
                        alt={analysis.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="md:w-2/3 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {analysis.file.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {analysis.status === 'analyzing' && (
                          <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                        {analysis.status === 'completed' && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                        {analysis.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="text-sm text-gray-600">
                          {analysis.status === 'analyzing' ? 'Analyzing...' : 
                           analysis.status === 'completed' ? 'Ready' :
                           analysis.status === 'error' ? 'Error' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div className={`h-2 rounded-full transition-all duration-500 ${
                        analysis.status === 'completed' ? 'bg-green-500 w-full' :
                        analysis.status === 'analyzing' ? 'bg-blue-500 w-3/4 animate-pulse' :
                        analysis.status === 'error' ? 'bg-red-500 w-full' :
                        'bg-gray-400 w-1/4'
                      }`} />
                    </div>

                    {/* Prompt Display */}
                    {analysis.status === 'completed' && analysis.prompt && (
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {analysis.prompt}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => copyPrompt(analysis.prompt!, analysis.id)}
                          className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            (analysis as any).copied
                              ? 'bg-green-500 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {(analysis as any).copied ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Error Display */}
                    {analysis.status === 'error' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <p className="text-sm">{analysis.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;