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
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ease-in-out
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
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
          {isDragOver ? (
            <ImageIcon className="w-8 h-8 text-white" />
          ) : (
            <Upload className="w-8 h-8 text-white" />
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          {isDragOver ? 'Drop your images here' : 'Upload Images'}
        </h3>
        
        <p className="text-gray-500 mb-4">
          {isDragOver 
            ? 'Release to upload your images' 
            : 'Drag and drop images here, or click to select files'
          }
        </p>
        
        <div className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          <Upload className="w-5 h-5 text-gray-600 mr-2" />
          <span className="text-gray-700 font-medium">Choose Files</span>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-400">
        Supports: JPG, PNG, GIF, WebP • Multiple files allowed
      </div>
    </div>
  );
}