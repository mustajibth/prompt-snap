import React, { useState, useEffect } from 'react';
import { Key, X, Check, AlertCircle, Loader } from 'lucide-react';

interface SerialActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SerialActivationModal({ isOpen, onClose }: SerialActivationModalProps) {
  const [serialNumber, setSerialNumber] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Check if already activated
      const activated = localStorage.getItem('promptsnap_activated') === 'true';
      setIsActivated(activated);
      if (activated) {
        const storedSerial = localStorage.getItem('promptsnap_serial');
        if (storedSerial) {
          setSerialNumber(storedSerial);
        }
      }
    }
  }, [isOpen]);

  const formatSerialNumber = (value: string) => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Limit to 16 characters
    const limited = cleaned.substring(0, 16);
    
    // Add dashes every 4 characters
    const formatted = limited.replace(/(.{4})/g, '$1-').replace(/-$/, '');
    
    return formatted;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSerialNumber(e.target.value);
    setSerialNumber(formatted);
    setError('');
  };

  const validateSerialNumber = (serial: string): boolean => {
    // Check if empty
    if (!serial.trim()) {
      setError('Please enter a serial number');
      return false;
    }

    // Check format (XXXX-XXXX-XXXX-XXXX)
    const serialPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!serialPattern.test(serial)) {
      setError('Please enter a valid serial number format (XXXX-XXXX-XXXX-XXXX)');
      return false;
    }

    // Check against invalid patterns
    const invalidPatterns = [
      '0000-0000-0000-0000',
      '1111-1111-1111-1111',
      'XXXX-XXXX-XXXX-XXXX'
    ];

    if (invalidPatterns.includes(serial)) {
      setError('This serial number is not valid');
      return false;
    }

    return true;
  };

  const handleActivation = async () => {
    if (isProcessing) return;

    if (!validateSerialNumber(serialNumber)) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock validation - in real app, this would be an API call
      const validSerials = [
        'ABCD-1234-EFGH-5678',
        'TEST-DEMO-SERIAL-2024',
        'PROM-SNAP-PREM-2024',
        'AJIB-STUD-PREM-2024'
      ];

      if (validSerials.includes(serialNumber)) {
        // Store activation status
        localStorage.setItem('promptsnap_activated', 'true');
        localStorage.setItem('promptsnap_serial', serialNumber);
        localStorage.setItem('promptsnap_activation_date', new Date().toISOString());
        
        setIsSuccess(true);
        setIsActivated(true);
        
        // Auto close after success
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
        }, 2000);
      } else {
        setError('Invalid serial number. Please check and try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivate = () => {
    localStorage.removeItem('promptsnap_activated');
    localStorage.removeItem('promptsnap_serial');
    localStorage.removeItem('promptsnap_activation_date');
    setIsActivated(false);
    setSerialNumber('');
    setError('');
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setError('');
      if (!isActivated) {
        setSerialNumber('');
      }
      setIsSuccess(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isActivated ? 'Premium Activated' : 'Activate Premium'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {isActivated ? 'Manage your activation' : 'Enter your serial number'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {isSuccess ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Activation Successful!
              </h3>
              <p className="text-gray-600">
                Your premium features have been unlocked.
              </p>
            </div>
          ) : isActivated ? (
            /* Already Activated State */
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-700 mb-2">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Premium Active</span>
                </div>
                <p className="text-green-600 text-sm mb-3">
                  Your premium features are currently active.
                </p>
                <div className="text-xs text-green-600">
                  <div>Serial: {serialNumber}</div>
                  <div>
                    Activated: {new Date(localStorage.getItem('promptsnap_activation_date') || '').toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleDeactivate}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  Deactivate
                </button>
              </div>
            </div>
          ) : (
            /* Activation Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={handleInputChange}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className={`w-full px-4 py-3 border-2 rounded-lg font-mono text-center transition-all ${
                    error 
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-2`}
                  maxLength={19}
                  disabled={isProcessing}
                />
                {error && (
                  <div className="flex items-center space-x-2 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Demo Serials */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-xs font-medium mb-2">Demo Serial Numbers:</p>
                <div className="space-y-1 text-xs text-blue-600 font-mono">
                  <div>ABCD-1234-EFGH-5678</div>
                  <div>TEST-DEMO-SERIAL-2024</div>
                  <div>AJIB-STUD-PREM-2024</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActivation}
                  disabled={isProcessing || !serialNumber.trim()}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Activate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}