// Logout Utility - Handles logout functionality across all customer pages
const logoutUtils = {
    /**
     * Initialize logout button listener
     * Must be called after page loads and logoutBtn exists in DOM
     */
    initLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (!logoutBtn) {
            console.warn('[LogoutUtils] logoutBtn element not found');
            return;
        }

        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.logout();
        });
    },

    /**
     * Perform logout
     */
    async logout() {
        try {
            // Clear authentication
            if (typeof authService !== 'undefined' && authService.logout) {
                await authService.logout();
            }

            // Clear localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');

            // Clear wishlist and cart if needed
            if (typeof wishlistService !== 'undefined') {
                wishlistService.clearWishlist();
            }
            if (typeof stateService !== 'undefined') {
                stateService.clearCart();
            }

            // Close burger menu if open
            const burgerMenuDropdown = document.getElementById('burgerMenuDropdown');
            if (burgerMenuDropdown) {
                burgerMenuDropdown.style.display = 'none';
            }

            // Redirect to login
            window.location.href = 'customerLogin.html';
        } catch (error) {
            console.error('[LogoutUtils] Logout error:', error);
            // Force redirect even if error occurs
            window.location.href = 'customerLogin.html';
        }
    }
};
