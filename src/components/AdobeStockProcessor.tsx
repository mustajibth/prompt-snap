import React, { useState } from 'react';
import { Globe, Download, AlertCircle, CheckCircle, Loader, Link, Image as ImageIcon, Zap } from 'lucide-react';
import { ScrapedImage } from '../types';
import { BatchProcessor, estimateProcessingTime } from '../utils/batchProcessor';
import BatchProgressModal from './BatchProgressModal';

interface AdobeStockProcessorProps {
  isOpen: boolean;
  onClose: () => void;
  onImagesSelected: (images: ScrapedImage[]) => void;
}

export default function AdobeStockProcessor({ isOpen, onClose, onImagesSelected }: AdobeStockProcessorProps) {
  const [adobeUrl, setAdobeUrl] = useState('');
  const [imageCount, setImageCount] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedImages, setExtractedImages] = useState<ScrapedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [showBatchProgress, setShowBatchProgress] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    completed: 0,
    total: 0,
    currentImage: '',
    errors: 0
  });

  const handleExtractImages = async () => {
    if (!adobeUrl.trim()) {
      setProcessingStatus('Please enter an Adobe Stock URL');
      return;
    }

    if (!isValidAdobeStockUrl(adobeUrl)) {
      setProcessingStatus('Please enter a valid Adobe Stock URL');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Extracting images from Adobe Stock...');

    try {
      // Simulate Adobe Stock image extraction
      const images = await extractAdobeStockImages(adobeUrl, imageCount);
      setExtractedImages(images);
      setProcessingStatus(`Successfully extracted ${images.length} images`);
      
      // Auto-select all images
      const allImageIds = new Set(images.map(img => img.url));
      setSelectedImages(allImageIds);
    } catch (error) {
      console.error('Error extracting images:', error);
      setProcessingStatus('Error extracting images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isValidAdobeStockUrl = (url: string): boolean => {
    return url.includes('stock.adobe.com') || url.includes('adobe.com');
  };

  const extractAdobeStockImages = async (url: string, count: number): Promise<ScrapedImage[]> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock Adobe Stock images using Pexels as placeholder
    const images: ScrapedImage[] = [];
    const categories = ['business', 'technology', 'nature', 'people', 'abstract'];
    const baseIds = [1000000, 1500000, 2000000, 2500000, 3000000];
    
    for (let i = 0; i < Math.min(count, 100); i++) {
      const category = categories[i % categories.length];
      const baseId = baseIds[i % baseIds.length];
      const imageId = baseId + i;
      
      images.push({
        url: `https://stock.adobe.com/image/${imageId}`,
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Stock Image ${i + 1}`,
        source: 'adobe-stock',
        thumbnail: `https://images.pexels.com/photos/${imageId}/pexels-photo-${imageId}.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop`
      });
    }
    
    return images;
  };

  const toggleImageSelection = (imageUrl: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageUrl)) {
      newSelected.delete(imageUrl);
    } else {
      newSelected.add(imageUrl);
    }
    setSelectedImages(newSelected);
  };

  const selectAllImages = () => {
    if (selectedImages.size === extractedImages.length) {
      setSelectedImages(new Set());
    } else {
      const allImageIds = new Set(extractedImages.map(img => img.url));
      setSelectedImages(allImageIds);
    }
  };

  const handleBatchProcess = async () => {
    const selected = extractedImages.filter(img => selectedImages.has(img.url));
    
    if (selected.length === 0) return;

    setShowBatchProgress(true);
    setBatchProgress({
      completed: 0,
      total: selected.length,
      currentImage: '',
      errors: 0
    });

    const processor = new BatchProcessor({
      maxConcurrent: 3, // Reduced for better stability
      delayBetweenRequests: 1500,
      retryAttempts: 2,
      onProgress: (completed, total, currentImage) => {
        setBatchProgress(prev => ({
          ...prev,
          completed,
          total,
          currentImage
        }));
      },
      onError: (error, imageUrl) => {
        setBatchProgress(prev => ({
          ...prev,
          errors: prev.errors + 1
        }));
        console.error('Batch processing error:', error, imageUrl);
      }
    });

    try {
      const results = await processor.processImages(selected, 'creative');
      
      // Convert successful results to the format expected by the main app
      const successfulImages = results
        .filter(result => result.success)
        .map(result => {
          const originalImage = selected.find(img => img.url === result.imageUrl);
          return originalImage!;
        });

      // Close progress modal and pass results
      setShowBatchProgress(false);
      onImagesSelected(successfulImages);
      onClose();
      
      // Reset state
      setAdobeUrl('');
      setExtractedImages([]);
      setSelectedImages(new Set());
      setProcessingStatus('');
      
    } catch (error) {
      console.error('Batch processing failed:', error);
      setShowBatchProgress(false);
      setProcessingStatus('Batch processing failed. Please try again.');
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state
    setAdobeUrl('');
    setExtractedImages([]);
    setSelectedImages(new Set());
    setProcessingStatus('');
    setIsProcessing(false);
  };

  const estimatedTime = selectedImages.size > 0 
    ? estimateProcessingTime(selectedImages.size, 3)
    : { estimatedMinutes: 0, estimatedSeconds: 0 };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-500 to-pink-500 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Adobe Stock Batch Processor</h2>
                  <p className="text-white/90 text-sm">Extract and analyze multiple images from Adobe Stock</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* URL Input Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adobe Stock URL
              </label>
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={adobeUrl}
                    onChange={(e) => setAdobeUrl(e.target.value)}
                    placeholder="https://stock.adobe.com/search?k=landscape"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    value={imageCount}
                    onChange={(e) => setImageCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="100"
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-center"
                    placeholder="Count"
                  />
                </div>
                <button
                  onClick={handleExtractImages}
                  disabled={isProcessing || !adobeUrl.trim()}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      <span>Extract</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Instructions */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-2">📋 Instructions:</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Paste any Adobe Stock search URL or collection URL</li>
                  <li>• Set the number of images to extract (1-100)</li>
                  <li>• Click "Extract" to get images from the page</li>
                  <li>• Select which images you want to analyze</li>
                  <li>• Click "Batch Process" to generate all prompts at once</li>
                </ul>
              </div>

              {/* Demo Notice */}
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 text-sm">
                      <strong>Demo Mode:</strong> This is a demonstration using placeholder images from Pexels. 
                      In production, this would require proper backend services and compliance with Adobe Stock's terms of service.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            {processingStatus && (
              <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
                processingStatus.includes('Error') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : processingStatus.includes('Successfully')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {processingStatus.includes('Error') ? (
                  <AlertCircle className="w-4 h-4" />
                ) : processingStatus.includes('Successfully') ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Loader className="w-4 h-4 animate-spin" />
                )}
                <span className="text-sm font-medium">{processingStatus}</span>
              </div>
            )}

            {/* Extracted Images Grid */}
            {extractedImages.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Extracted Images ({extractedImages.length})
                  </h3>
                  <button
                    onClick={selectAllImages}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors"
                  >
                    {selectedImages.size === extractedImages.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {extractedImages.map((image, index) => (
                      <div
                        key={image.url}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImages.has(image.url)
                            ? 'border-red-500 ring-2 ring-red-200'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                        onClick={() => toggleImageSelection(image.url)}
                      >
                        <div className="aspect-square bg-gray-100">
                          <img
                            src={image.thumbnail}
                            alt={image.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        
                        {/* Selection Overlay */}
                        <div className={`absolute inset-0 bg-red-500/20 flex items-center justify-center transition-opacity ${
                          selectedImages.has(image.url) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedImages.has(image.url)
                              ? 'bg-red-500 border-red-500'
                              : 'bg-white border-white'
                          }`}>
                            {selectedImages.has(image.url) && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Image Number */}
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-1 text-xs rounded-full bg-black/70 text-white font-medium">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {extractedImages.length > 0 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selectedImages.size}</span> of{' '}
                  <span className="font-medium">{extractedImages.length}</span> images selected
                  {selectedImages.size > 0 && (
                    <div className="mt-1 text-blue-600">
                      <Zap className="w-3 h-3 inline mr-1" />
                      Estimated time: {estimatedTime.estimatedMinutes}m {estimatedTime.estimatedSeconds}s
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchProcess}
                    disabled={selectedImages.size === 0}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Batch Process ({selectedImages.size})</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch Progress Modal */}
      <BatchProgressModal
        isOpen={showBatchProgress}
        onClose={() => setShowBatchProgress(false)}
        progress={batchProgress}
        estimatedTime={estimatedTime}
      />
    </>
  );
}