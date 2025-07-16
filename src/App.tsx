import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export default function UploadArea({ onFilesSelected, isProcessing }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input value to allow selecting the same files again
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-full">
      {/* Header */}
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
      </header>

      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ease-in-out
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className={`transition-all duration-300 ${isDragOver ? 'scale-110' : ''}`}>
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mb-3">
            {isDragOver ? (
              <ImageIcon className="w-6 h-6 text-white" />
            ) : (
              <Upload className="w-6 h-6 text-white" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {isDragOver ? 'Drop your images here' : 'Upload Images'}
          </h3>
          
          <p className="text-gray-500 mb-3 text-sm">
            {/* Status Display */}
            {isDragOver 
              ? 'Release to upload your images'
              : 'Drag and drop images here, or click to select files'
            }
          </p>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-400">
        Supports: JPG, PNG, GIF, WebP • Multiple files allowed
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
      </div>
    </div>
  );
}