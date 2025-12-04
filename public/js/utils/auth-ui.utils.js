/**
 * Authentication UI Utilities
 * Handles form validation, error display, success handling
 */

const authUIUtils = {
    /**
     * Validate email format
     */
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate password strength
     * Returns: weak, medium, strong
     */
    getPasswordStrength: (password) => {
        if (!password) return null;

        let strength = 0;

        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;

        // Character variety checks
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) return 'weak';
        if (strength <= 4) return 'medium';
        return 'strong';
    },

    /**
     * Update password strength indicator
     */
    updatePasswordStrength: (inputElement, strengthBarElement, strengthTextElement) => {
        const password = inputElement.value;
        const strength = authUIUtils.getPasswordStrength(password);

        if (!strength) {
            strengthBarElement?.classList.remove('weak', 'medium', 'strong');
            strengthTextElement && (strengthTextElement.innerHTML = '');
            return;
        }

        strengthBarElement?.classList.remove('weak', 'medium', 'strong');
        strengthBarElement?.classList.add(strength);

        if (strengthTextElement) {
            const strengthText = {
                weak: 'Weak password',
                medium: 'Medium strength',
                strong: 'Strong password'
            };
            strengthTextElement.textContent = strengthText[strength];
            strengthTextElement.className = `password-strength-text ${strength}`;
        }
    },

    /**
     * Show error message
     */
    showError: (message, alertElement, clearOthers = true) => {
        if (!alertElement) return;

        if (clearOthers) {
            authUIUtils.clearMessages(alertElement.parentElement);
        }

        alertElement.textContent = message;
        alertElement.classList.remove('alert-success', 'alert-info', 'alert-warning');
        alertElement.classList.add('alert-error', 'show');
        alertElement.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => {
                alertElement.style.display = 'none';
            }, 300);
        }, 5000);
    },

    /**
     * Show success message
     */
    showSuccess: (message, alertElement, clearOthers = true) => {
        if (!alertElement) return;

        if (clearOthers) {
            authUIUtils.clearMessages(alertElement.parentElement);
        }

        alertElement.textContent = message;
        alertElement.classList.remove('alert-error', 'alert-info', 'alert-warning');
        alertElement.classList.add('alert-success', 'show');
        alertElement.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => {
                alertElement.style.display = 'none';
            }, 300);
        }, 3000);
    },

    /**
     * Show info message
     */
    showInfo: (message, alertElement, clearOthers = true) => {
        if (!alertElement) return;

        if (clearOthers) {
            authUIUtils.clearMessages(alertElement.parentElement);
        }

        alertElement.textContent = message;
        alertElement.classList.remove('alert-error', 'alert-success', 'alert-warning');
        alertElement.classList.add('alert-info', 'show');
        alertElement.style.display = 'block';
    },

    /**
     * Show warning message
     */
    showWarning: (message, alertElement, clearOthers = true) => {
        if (!alertElement) return;

        if (clearOthers) {
            authUIUtils.clearMessages(alertElement.parentElement);
        }

        alertElement.textContent = message;
        alertElement.classList.remove('alert-error', 'alert-success', 'alert-info');
        alertElement.classList.add('alert-warning', 'show');
        alertElement.style.display = 'block';
    },

    /**
     * Clear all messages in container
     */
    clearMessages: (container) => {
        if (!container) return;

        const alerts = container.querySelectorAll('.alert');
        alerts.forEach(alert => {
            alert.classList.remove('show');
            alert.style.display = 'none';
        });
    },

    /**
     * Show field error
     */
    showFieldError: (fieldElement, errorMessage) => {
        fieldElement.classList.add('error');

        let errorElement = fieldElement.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('form-error')) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
        }

        errorElement.textContent = errorMessage;
        errorElement.classList.add('show');
    },

    /**
     * Clear field error
     */
    clearFieldError: (fieldElement) => {
        fieldElement.classList.remove('error');

        let errorElement = fieldElement.nextElementSibling;
        if (errorElement && errorElement.classList.contains('form-error')) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
    },

    /**
     * Disable form button
     */
    disableButton: (buttonElement, loadingText = 'Loading...') => {
        buttonElement.disabled = true;
        buttonElement.classList.add('btn-loading');
        buttonElement.dataset.originalText = buttonElement.textContent;
        buttonElement.textContent = loadingText;
    },

    /**
     * Enable form button
     */
    enableButton: (buttonElement) => {
        buttonElement.disabled = false;
        buttonElement.classList.remove('btn-loading');
        buttonElement.textContent = buttonElement.dataset.originalText || 'Submit';
    },

    /**
     * Validate form fields
     * Returns: { isValid: boolean, errors: {} }
     */
    validateForm: (formData, rules) => {
        const errors = {};

        for (const [field, value] of Object.entries(formData)) {
            if (!rules[field]) continue;

            const fieldRules = rules[field];

            // Required check
            if (fieldRules.required && (!value || value.trim() === '')) {
                errors[field] = fieldRules.requiredMessage || `${field} is required`;
                continue;
            }

            // Email check
            if (fieldRules.type === 'email' && value && !authUIUtils.isValidEmail(value)) {
                errors[field] = 'Invalid email format';
                continue;
            }

            // Min length
            if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
                errors[field] = fieldRules.minLengthMessage || `Minimum ${fieldRules.minLength} characters`;
                continue;
            }

            // Max length
            if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
                errors[field] = fieldRules.maxLengthMessage || `Maximum ${fieldRules.maxLength} characters`;
                continue;
            }

            // Custom validator
            if (fieldRules.validator && typeof fieldRules.validator === 'function') {
                const validationResult = fieldRules.validator(value);
                if (validationResult !== true) {
                    errors[field] = validationResult || 'Invalid input';
                    continue;
                }
            }

            // Match field (e.g., password confirmation)
            if (fieldRules.matchField && formData[fieldRules.matchField] !== value) {
                errors[field] = fieldRules.matchMessage || 'Fields do not match';
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Display form validation errors
     */
    displayFormErrors: (form, errors) => {
        // Clear all previous errors
        form.querySelectorAll('input, textarea').forEach(field => {
            authUIUtils.clearFieldError(field);
        });

        // Show new errors
        for (const [fieldName, errorMessage] of Object.entries(errors)) {
            const fieldElement = form.querySelector(`[name="${fieldName}"]`);
            if (fieldElement) {
                authUIUtils.showFieldError(fieldElement, errorMessage);
            }
        }
    },

    /**
     * Extract form data as object
     */
    getFormData: (form) => {
        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    },

    /**
     * Start countdown timer
     */
    startCountdown: (elementId, seconds, onExpire = null) => {
        let remaining = seconds;
        const element = document.getElementById(elementId);

        if (!element) return;

        const interval = setInterval(() => {
            remaining--;

            if (remaining <= 0) {
                clearInterval(interval);
                element.textContent = 'Code expired';
                element.classList.add('expired');
                if (onExpire) onExpire();
                return;
            }

            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            element.innerHTML = `Expires in: <strong>${mins}:${secs.toString().padStart(2, '0')}</strong>`;
        }, 1000);

        return interval;
    },

    /**
     * Format timer display
     */
    formatTime: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Handle auto-focus on verification code inputs
     */
    setupVerificationCodeInputs: (containerSelector) => {
        const inputs = document.querySelectorAll(`${containerSelector} input`);

        inputs.forEach((input, index) => {
            input.addEventListener('keyup', (e) => {
                // Move to next input on digit entry
                if (e.key >= '0' && e.key <= '9' && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }

                // Move to previous input on backspace
                if (e.key === 'Backspace' && index > 0 && input.value === '') {
                    inputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = (e.clipboardData || window.clipboardData).getData('text');
                const numbers = pastedData.replace(/\D/g, '').split('');

                numbers.forEach((num, i) => {
                    if (inputs[index + i]) {
                        inputs[index + i].value = num;
                    }
                });

                if (numbers.length > 0) {
                    inputs[Math.min(index + numbers.length - 1, inputs.length - 1)].focus();
                }
            });
        });
    },

    /**
     * Get verification code from inputs
     */
    getVerificationCode: (containerSelector) => {
        const inputs = document.querySelectorAll(`${containerSelector} input`);
        return Array.from(inputs).map(input => input.value).join('');
    }
};
