/**
 * Serial Number Activation Popup Functionality
 * Handles modal opening/closing, form validation, and activation process
 */

class SerialActivationModal {
    constructor() {
        // DOM Elements
        this.activateBtn = document.getElementById('activateBtn');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modalContainer = document.getElementById('modalContainer');
        this.closeBtn = document.getElementById('closeBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.activationForm = document.getElementById('activationForm');
        this.serialNumberInput = document.getElementById('serialNumber');
        this.errorMessage = document.getElementById('errorMessage');
        this.submitBtn = document.getElementById('submitBtn');
        this.loadingState = document.getElementById('loadingState');
        this.successState = document.getElementById('successState');
        this.doneBtn = document.getElementById('doneBtn');

        // State
        this.isOpen = false;
        this.isProcessing = false;

        // Initialize
        this.init();
    }

    /**
     * Initialize event listeners and setup
     */
    init() {
        // Button event listeners
        this.activateBtn.addEventListener('click', () => this.openModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.doneBtn.addEventListener('click', () => this.closeModal());

        // Modal overlay click (close when clicking outside)
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.closeModal();
            }
        });

        // Form submission
        this.activationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleActivation();
        });

        // Real-time input validation
        this.serialNumberInput.addEventListener('input', () => {
            this.clearError();
            this.formatSerialNumber();
        });

        // Keyboard event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeModal();
            }
        });

        // Prevent form submission on Enter if input is invalid
        this.serialNumberInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.validateSerialNumber()) {
                    this.handleActivation();
                }
            }
        });
    }

    /**
     * Open the modal with animation
     */
    openModal() {
        this.isOpen = true;
        this.modalOverlay.classList.add('active');
        
        // Focus on input field after animation
        setTimeout(() => {
            this.serialNumberInput.focus();
        }, 300);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Reset form state
        this.resetForm();
    }

    /**
     * Close the modal with animation
     */
    closeModal() {
        this.isOpen = false;
        this.modalOverlay.classList.remove('active');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Reset form after animation completes
        setTimeout(() => {
            this.resetForm();
        }, 300);
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        this.activationForm.style.display = 'block';
        this.loadingState.classList.add('hidden');
        this.successState.classList.add('hidden');
        
        this.serialNumberInput.value = '';
        this.clearError();
        this.serialNumberInput.classList.remove('error', 'success');
        this.submitBtn.disabled = false;
        this.isProcessing = false;
    }

    /**
     * Format serial number input with dashes (XXXX-XXXX-XXXX-XXXX)
     */
    formatSerialNumber() {
        let value = this.serialNumberInput.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        
        // Limit to 16 characters
        if (value.length > 16) {
            value = value.substring(0, 16);
        }
        
        // Add dashes every 4 characters
        const formatted = value.replace(/(.{4})/g, '$1-').replace(/-$/, '');
        this.serialNumberInput.value = formatted;
    }

    /**
     * Validate serial number format
     * @returns {boolean} True if valid, false otherwise
     */
    validateSerialNumber() {
        const serialNumber = this.serialNumberInput.value.trim();
        
        // Clear previous errors
        this.clearError();
        
        // Check if empty
        if (!serialNumber) {
            this.showError('Please enter a serial number');
            return false;
        }
        
        // Check format (XXXX-XXXX-XXXX-XXXX)
        const serialPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (!serialPattern.test(serialNumber)) {
            this.showError('Please enter a valid serial number format (XXXX-XXXX-XXXX-XXXX)');
            return false;
        }
        
        // Additional validation rules can be added here
        // For example, check against known invalid patterns
        const invalidPatterns = [
            '0000-0000-0000-0000',
            '1111-1111-1111-1111',
            'XXXX-XXXX-XXXX-XXXX'
        ];
        
        if (invalidPatterns.includes(serialNumber)) {
            this.showError('This serial number is not valid');
            return false;
        }
        
        return true;
    }

    /**
     * Show error message and apply error styling
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.errorMessage.textContent = message;
        this.serialNumberInput.classList.add('error', 'shake');
        
        // Remove shake animation after it completes
        setTimeout(() => {
            this.serialNumberInput.classList.remove('shake');
        }, 500);
    }

    /**
     * Clear error message and styling
     */
    clearError() {
        this.errorMessage.textContent = '';
        this.serialNumberInput.classList.remove('error');
    }

    /**
     * Handle the activation process
     */
    async handleActivation() {
        // Prevent multiple submissions
        if (this.isProcessing) return;
        
        // Validate input
        if (!this.validateSerialNumber()) {
            return;
        }
        
        this.isProcessing = true;
        const serialNumber = this.serialNumberInput.value.trim();
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Simulate API call for activation
            const result = await this.activateSerial(serialNumber);
            
            if (result.success) {
                this.showSuccessState();
            } else {
                this.showError(result.message || 'Activation failed. Please try again.');
                this.hideLoadingState();
            }
            
        } catch (error) {
            console.error('Activation error:', error);
            this.showError('Network error. Please check your connection and try again.');
            this.hideLoadingState();
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        this.activationForm.style.display = 'none';
        this.loadingState.classList.remove('hidden');
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        this.loadingState.classList.add('hidden');
        this.activationForm.style.display = 'block';
        this.isProcessing = false;
    }

    /**
     * Show success state
     */
    showSuccessState() {
        this.loadingState.classList.add('hidden');
        this.successState.classList.remove('hidden');
        this.isProcessing = false;
    }

    /**
     * Simulate serial number activation API call
     * @param {string} serialNumber - The serial number to activate
     * @returns {Promise<Object>} Activation result
     */
    async activateSerial(serialNumber) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock validation logic
        // In a real application, this would be an API call to your backend
        const validSerials = [
            'ABCD-1234-EFGH-5678',
            'TEST-DEMO-SERIAL-2024',
            'PROM-SNAP-PREM-2024'
        ];
        
        if (validSerials.includes(serialNumber)) {
            // Store activation status (in real app, this would be handled by backend)
            localStorage.setItem('promptsnap_activated', 'true');
            localStorage.setItem('promptsnap_serial', serialNumber);
            
            return {
                success: true,
                message: 'Activation successful'
            };
        } else {
            return {
                success: false,
                message: 'Invalid serial number. Please check and try again.'
            };
        }
    }

    /**
     * Check if the application is already activated
     * @returns {boolean} True if activated, false otherwise
     */
    static isActivated() {
        return localStorage.getItem('promptsnap_activated') === 'true';
    }

    /**
     * Get the stored serial number
     * @returns {string|null} The stored serial number or null
     */
    static getStoredSerial() {
        return localStorage.getItem('promptsnap_serial');
    }
}

// Initialize the modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create modal instance
    const modal = new SerialActivationModal();
    
    // Check if already activated and update UI accordingly
    if (SerialActivationModal.isActivated()) {
        const activateBtn = document.getElementById('activateBtn');
        const serial = SerialActivationModal.getStoredSerial();
        
        activateBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"/>
            </svg>
            Activated (${serial ? serial.substring(0, 9) + '...' : 'Premium'})
        `;
        activateBtn.style.background = '#10b981';
        activateBtn.style.color = 'white';
    }
    
    // Add some demo functionality
    console.log('Serial Activation Modal initialized');
    console.log('Demo serial numbers for testing:');
    console.log('- ABCD-1234-EFGH-5678');
    console.log('- TEST-DEMO-SERIAL-2024');
    console.log('- PROM-SNAP-PREM-2024');
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SerialActivationModal;
}