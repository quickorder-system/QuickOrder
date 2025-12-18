/**
 * Discount Service
 * Handles all discount-related API calls and calculations
 */

const discountService = {
    /**
     * Validate a discount code and get discount details
     * @param {string} code - Discount code to validate
     * @param {number} orderAmount - Current order total (in pesos)
     * @returns {Promise} Discount details if valid
     */
    async validateCode(code, orderAmount) {
        try {
            if (!code) {
                throw new Error('Discount code is required');
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`/api/discounts/validate/${code}?orderAmount=${orderAmount}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Invalid discount code');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    },

    /**
     * Calculate final order total with discount applied
     * @param {number} subtotal - Order subtotal before discount
     * @param {object} discount - Discount object with type and amount
     * @returns {object} Breakdown of subtotal, discount, and final total
     */
    calculateTotal(subtotal, discount) {
        if (!discount || !discount.discount || discount.discount.discountAmount === 0) {
            return {
                subtotal,
                discountAmount: 0,
                total: subtotal
            };
        }

        const discountAmount = discount.discount.discountAmount || 0;
        const total = Math.max(0, subtotal - discountAmount);

        return {
            subtotal,
            discountAmount,
            total
        };
    },

    /**
     * Format discount display string
     * @param {object} discountData - Discount object
     * @returns {string} Formatted discount string (e.g., "WELCOME10 - 10% off" or "SAVE50 - ₱50 off")
     */
    formatDiscountDisplay(discountData) {
        if (!discountData) return '';

        const { code, discountType, discountValue } = discountData;
        
        if (discountType === 'percentage') {
            return `${code} - ${discountValue}% off`;
        } else {
            return `${code} - ₱${discountValue} off`;
        }
    },

    /**
     * Get all active discounts (for display purposes - admin/owner only)
     * @returns {Promise} List of active discounts
     */
    async getActiveDiscounts() {
        try {
            const token = localStorage.getItem('token');
            console.log('[DiscountService] getActiveDiscounts - Token exists:', !!token);
            if (token) {
                console.log('[DiscountService] Token preview:', token.substring(0, 50) + '...');
            }
            const response = await fetch('/api/discounts?isActive=true', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch discounts');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching discounts:', error);
            return { discounts: [] };
        }
    },

    /**
     * Create new discount (Admin/Owner only)
     * @param {object} discountData - Discount details
     * @returns {Promise} Created discount
     */
    async createDiscount(discountData) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/discounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(discountData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create discount');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update existing discount (Admin/Owner only)
     * @param {string} discountId - Discount ID
     * @param {object} discountData - Updated discount details
     * @returns {Promise} Updated discount
     */
    async updateDiscount(discountId, discountData) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/discounts/${discountId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(discountData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update discount');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    },

    /**
     * Delete discount (Admin/Owner only)
     * @param {string} discountId - Discount ID
     * @returns {Promise} Success message
     */
    async deleteDiscount(discountId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/discounts/${discountId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete discount');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    },

    /**
     * Validate discount code format
     * @param {string} code - Code to validate
     * @returns {boolean} True if valid format
     */
    isValidCodeFormat(code) {
        // Code must be 3-20 alphanumeric characters
        return /^[A-Z0-9]{3,20}$/.test(code.toUpperCase());
    },

    /**
     * Get eligible automatic discounts (SC/PWD)
     * @returns {Promise} List of eligible discounts
     */
    async getEligibleDiscounts() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/discounts/eligible-discounts', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch eligible discounts');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    },

    /**
     * Apply automatic discount (SC/PWD)
     * @param {string} discountType - 'SC' or 'PWD'
     * @param {number} orderAmount - Current order total
     * @returns {Promise} Discount details
     */
    async applyAutomaticDiscount(discountType, orderAmount) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/discounts/apply-automatic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    discountType,
                    orderAmount
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || error.message || 'Failed to apply discount');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    },

    /**
     * Toggle automatic discount preference
     * @param {string} discountType - 'SC' or 'PWD'
     * @param {boolean} enabled - Enable or disable
     * @returns {Promise} Updated preferences
     */
    async toggleAutomaticDiscount(discountType, enabled) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/discounts/toggle-automatic', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    discountType,
                    enabled
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || error.message || 'Failed to toggle discount');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = discountService;
}
