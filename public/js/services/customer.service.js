/**
 * Customer Service
 * Handles customer profile and order management API calls
 */

const customerService = {
    /**
     * Get customer profile
     */
    getProfile: async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/customers/profile', {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch profile');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update customer profile
     */
    updateProfile: async (profileData) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/customers/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get customer orders
     */
    getOrders: async (page = 1, limit = 10, status = null) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            let url = `/api/customers/orders?page=${page}&limit=${limit}`;
            if (status) {
                url += `&status=${status}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch orders');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get single order details
     */
    getOrderDetails: async (orderId) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`/api/customers/orders/${orderId}`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch order details');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Change password
     */
    changePassword: async (currentPassword, newPassword) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/customers/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to change password');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get delivery addresses
     */
    getAddresses: async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/customers/addresses', {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch addresses');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Add delivery address
     */
    addAddress: async (addressData) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/customers/addresses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(addressData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add address');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update delivery address
     */
    updateAddress: async (addressId, addressData) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`/api/customers/addresses/${addressId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(addressData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update address');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Delete delivery address
     */
    deleteAddress: async (addressId) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`/api/customers/addresses/${addressId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete address');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Set default address
     */
    setDefaultAddress: async (addressId) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`/api/customers/addresses/${addressId}/default`, {
                method: 'PUT',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to set default address');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update customer eligibility profile (SC/PWD)
     */
    updateEligibility: async (eligibilityData) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/customers/profile/eligibility', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(eligibilityData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update eligibility');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update customer eligibility profile with file upload
     */
    updateEligibilityWithFile: async (formData) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/customers/profile/eligibility', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update eligibility');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update discount preferences
     */
    updateDiscountPreferences: async (preferences) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/customers/discount-preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(preferences)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update preferences');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get eligible automatic discounts
     */
    getEligibleDiscounts: async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/discounts/eligible-discounts', {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch eligible discounts');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }
};
