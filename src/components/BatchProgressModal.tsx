import React from 'react';
import { Loader, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface BatchProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: {
    completed: number;
    total: number;
    currentImage: string;
    errors: number;
  };
  estimatedTime: {
    estimatedMinutes: number;
    estimatedSeconds: number;
  };
}

export default function BatchProgressModal({ 
  isOpen, 
  onClose, 
  progress, 
  estimatedTime 
}: BatchProgressModalProps) {
  if (!isOpen) return null;

  const progressPercentage = (progress.completed / progress.total) * 100;
  const isComplete = progress.completed === progress.total;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              {isComplete ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <Loader className="w-5 h-5 text-white animate-spin" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isComplete ? 'Batch Processing Complete!' : 'Processing Images...'}
              </h2>
              <p className="text-gray-600 text-sm">
                {isComplete 
                  ? `Successfully processed ${progress.completed - progress.errors} images`
                  : 'Generating AI prompts for your images'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Progress Content */}
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress: {progress.completed} / {progress.total}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Current Status */}
          {!isComplete && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Loader className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-sm font-medium text-blue-800">Currently Processing</span>
              </div>
              <p className="text-blue-700 text-sm truncate">
                {progress.currentImage}
              </p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {progress.completed - progress.errors}
              </div>
              <div className="text-xs text-green-700 font-medium">Successful</div>
            </div>
            
            {progress.errors > 0 && (
              <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {progress.errors}
                </div>
                <div className="text-xs text-red-700 font-medium">Errors</div>
              </div>
            )}
          </div>

          {/* Estimated Time */}
          {!isComplete && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-6">
              <Clock className="w-4 h-4" />
              <span>
                Estimated time: {estimatedTime.estimatedMinutes}m {estimatedTime.estimatedSeconds}s
              </span>
            </div>
          )}

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 text-sm font-medium mb-1">
                  {isComplete ? 'Processing Complete!' : 'Processing Tips:'}
                </p>
                <ul className="text-amber-700 text-xs space-y-1">
                  {isComplete ? (
                    <>
                      <li>• All prompts are ready for use with AI image generators</li>
                      <li>• You can copy individual prompts or download all results</li>
                      <li>• Check the quality scores for best results</li>
                    </>
                  ) : (
                    <>
                      <li>• Keep this tab open during processing</li>
                      <li>• Processing happens in batches to respect API limits</li>
                      <li>• Failed images will be retried automatically</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={!isComplete}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isComplete
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isComplete ? 'View Results' : 'Processing...'}
          </button>
        </div>
      </div>
    </div>
  );
}