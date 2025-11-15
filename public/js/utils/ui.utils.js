// UI Utility functions
const uiUtils = {
    // Show an alert message
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;

        // Remove any existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Add the new alert
        document.body.insertAdjacentElement('afterbegin', alertDiv);

        // Remove the alert after 5 seconds
        setTimeout(() => alertDiv.remove(), 5000);
    },

    // Toggle loading state
    toggleLoading(element, isLoading) {
        if (!element) return;

        const originalContent = element.dataset.originalContent || element.innerHTML;
        
        if (isLoading) {
            element.dataset.originalContent = originalContent;
            element.innerHTML = '<div class="spinner"></div>';
            element.disabled = true;
        } else {
            element.innerHTML = originalContent;
            element.disabled = false;
            delete element.dataset.originalContent;
        }
    },

    // Modal functions
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    },

    // Form validation
    validateForm(form) {
        const formData = new FormData(form);
        const errors = {};

        for (const [key, value] of formData.entries()) {
            const input = form.elements[key];
            const validationRules = input.dataset.validate ? JSON.parse(input.dataset.validate) : {};

            if (validationRules.required && !value) {
                errors[key] = 'This field is required';
            } else if (validationRules.email && !this.isValidEmail(value)) {
                errors[key] = 'Please enter a valid email address';
            } else if (validationRules.minLength && value.length < validationRules.minLength) {
                errors[key] = `Must be at least ${validationRules.minLength} characters`;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    // Show form errors
    showFormErrors(form, errors) {
        // Clear existing error messages
        form.querySelectorAll('.error-message').forEach(el => el.remove());

        // Add new error messages
        for (const [key, message] of Object.entries(errors)) {
            const input = form.elements[key];
            if (input) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message text-danger text-sm mt-1';
                errorDiv.textContent = message;
                input.parentNode.appendChild(errorDiv);
            }
        }
    },

    // Email validation
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Format date
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
};

// Make uiUtils available globally
window.uiUtils = uiUtils;
