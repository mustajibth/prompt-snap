import React, { useState } from 'react';
import { Search, Globe, Download, X } from 'lucide-react';
import { ScrapedImage } from '../types';
import { scrapeFromBothSources } from '../utils/scraper';

interface ScrapingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImagesSelected: (images: ScrapedImage[]) => void;
}

export default function ScrapingModal({ isOpen, onClose, onImagesSelected }: ScrapingModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScrapedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const images = await scrapeFromBothSources(query.trim(), 40);
      setResults(images);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
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

  const handleImportSelected = () => {
    const selected = results.filter(img => selectedImages.has(img.url));
    onImagesSelected(selected);
    onClose();
    setResults([]);
    setSelectedImages(new Set());
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Stock Image Search</h2>
                <p className="text-gray-600 text-sm">Search Adobe Stock & Vecteezy</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Search Bar */}
          <div className="flex space-x-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for images (e.g., 'mountain landscape', 'business team')..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </button>
          </div>

          {/* Notice */}
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> This is a demo implementation. In production, scraping would require proper backend services 
              and compliance with platform terms of service. Currently showing sample images from Pexels.
            </p>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Searching stock images...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {results.map((image) => (
                  <div
                    key={image.url}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImages.has(image.url)
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => toggleImageSelection(image.url)}
                  >
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={image.thumbnail}
                        alt={image.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Selection Overlay */}
                    <div className={`absolute inset-0 bg-blue-500/20 flex items-center justify-center transition-opacity ${
                      selectedImages.has(image.url) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedImages.has(image.url)
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-white'
                      }`}>
                        {selectedImages.has(image.url) && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>

                    {/* Source Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 text-xs rounded-full text-white font-medium ${
                        image.source === 'adobe-stock' ? 'bg-red-500' : 'bg-green-500'
                      }`}>
                        {image.source === 'adobe-stock' ? 'Adobe' : 'Vecteezy'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : query && !isSearching ? (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No results found for "{query}"</p>
                <p className="text-sm">Try different keywords</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedImages.size} of {results.length} images selected
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSelected}
                  disabled={selectedImages.size === 0}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Import Selected ({selectedImages.size})</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}