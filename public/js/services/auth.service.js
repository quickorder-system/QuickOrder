/**
 * Authentication Service
 * Handles all customer authentication API calls
 */

const authService = {
    /**
     * Register new customer
     */
    register: async (email, password, name) => {
        try {
            const response = await fetch('/api/auth/customer/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    name
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Login customer
     */
    login: async (email, password) => {
        try {
            const response = await fetch('/api/auth/customer/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token in localStorage
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userEmail', data.user.email);
                localStorage.setItem('userName', data.user.name);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userRole', data.user.role || 'user');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Verify email with token
     */
    verifyEmail: async (token) => {
        try {
            const response = await fetch('/api/auth/customer/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Email verification failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Resend verification email
     */
    resendVerification: async (email) => {
        try {
            const response = await fetch('/api/auth/customer/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Resend verification failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Request password reset
     */
    forgotPassword: async (email) => {
        try {
            const response = await fetch('/api/auth/customer/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Password reset request failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Reset password with token
     */
    resetPassword: async (token, newPassword) => {
        try {
            const response = await fetch('/api/auth/customer/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Password reset failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get current user profile (requires auth token)
     */
    getCurrentUser: async () => {
        try {
            const token = localStorage.getItem('authToken');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/auth/customer/me', {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get user profile');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Logout
     */
    logout: async () => {
        try {
            const token = localStorage.getItem('authToken');

            if (token) {
                await fetch('/api/auth/customer/logout', {
                    method: 'POST',
                    headers: {
                        'x-auth-token': token
                    }
                });
            }

            // Clear localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');

            return { message: 'Logout successful' };
        } catch (error) {
            // Still clear local storage even if API call fails
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');
            throw error;
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => {
        return !!localStorage.getItem('authToken');
    },

    /**
     * Get authentication token
     */
    getToken: () => {
        return localStorage.getItem('authToken');
    },

    /**
     * Get user from localStorage
     */
    getUser: () => {
        return {
            id: localStorage.getItem('userId'),
            email: localStorage.getItem('userEmail'),
            name: localStorage.getItem('userName')
        };
    }
};
