import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Eye, EyeOff, Settings } from 'lucide-react';
import { APIKeyConfig } from '../types';
import { updateAPIKeys, getAPIKeys } from '../utils/gemini';

interface APIKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function APIKeyManager({ isOpen, onClose }: APIKeyManagerProps) {
  const [keys, setKeys] = useState<APIKeyConfig[]>([]);
  const [newKey, setNewKey] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setKeys(getAPIKeys());
    }
  }, [isOpen]);

  const handleAddKey = () => {
    if (!newKey.trim()) return;

    const updatedKeys = [...keys, {
      id: `key-${Date.now()}`,
      key: newKey.trim(),
      name: `API Key ${keys.length + 1}`,
      isActive: true,
      requestCount: 0
    }];

    setKeys(updatedKeys);
    updateAPIKeys(updatedKeys);
    setNewKey('');
  };

  const handleRemoveKey = (keyId: string) => {
    const updatedKeys = keys.filter(k => k.id !== keyId);
    setKeys(updatedKeys);
    updateAPIKeys(updatedKeys);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const toggleKeyActive = (keyId: string) => {
    const updatedKeys = keys.map(k =>
      k.id === keyId ? { ...k, isActive: !k.isActive } : k
    );
    setKeys(updatedKeys);
    updateAPIKeys(updatedKeys);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">API Key Manager</h2>
                <p className="text-gray-600 text-sm">Manage your Gemini API keys</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
          {/* Add New Key */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New API Key
            </label>
            <div className="flex space-x-2">
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Enter Gemini API key..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddKey()}
              />
              <button
                onClick={handleAddKey}
                disabled={!newKey.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* API Keys List */}
          <div className="space-y-3 min-h-0">
            <h3 className="font-medium text-gray-900">
              API Keys ({keys.length})
            </h3>
            
            {keys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No API keys configured</p>
                <p className="text-sm">Add your first Gemini API key above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                <div
                  key={key.id}
                  className={`p-4 border rounded-lg transition-all ${
                    key.isActive 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">{key.name}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          key.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {key.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <code className="text-sm bg-white px-2 py-1 rounded border font-mono">
                          {showKeys[key.id] 
                            ? key.key 
                            : `${key.key.substring(0, 8)}${'•'.repeat(20)}`
                          }
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="p-1 hover:bg-white rounded transition-colors"
                        >
                          {showKeys[key.id] ? (
                            <EyeOff className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        Requests: {key.requestCount} • 
                        Last used: {key.lastUsed ? key.lastUsed.toLocaleString() : 'Never'}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleKeyActive(key.id)}
                        className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                          key.isActive
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {key.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleRemoveKey(key.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>💡 Multiple API keys enable load balancing and higher rate limits</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}