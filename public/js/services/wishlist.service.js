/**
 * Wishlist Service
 * Handles wishlist/favorites management with localStorage
 */

const wishlistService = {
    /**
     * Get all items in wishlist
     */
    getWishlist: () => {
        try {
            const wishlist = localStorage.getItem('wishlist');
            return wishlist ? JSON.parse(wishlist) : [];
        } catch (error) {
            console.error('Error getting wishlist:', error);
            return [];
        }
    },

    /**
     * Add item to wishlist
     */
    addToWishlist: (item) => {
        try {
            const wishlist = wishlistService.getWishlist();
            
            // Check if item already exists
            const exists = wishlist.some(w => w._id === item._id);
            if (exists) {
                return false;
            }
            
            // Add the item with timestamp
            wishlist.push({
                ...item,
                addedToWishlistAt: new Date().toISOString()
            });
            
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            return true;
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            return false;
        }
    },

    /**
     * Remove item from wishlist
     */
    removeFromWishlist: (itemId) => {
        try {
            let wishlist = wishlistService.getWishlist();
            wishlist = wishlist.filter(item => item._id !== itemId);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            return true;
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            return false;
        }
    },

    /**
     * Check if item is in wishlist
     */
    isInWishlist: (itemId) => {
        try {
            const wishlist = wishlistService.getWishlist();
            return wishlist.some(item => item._id === itemId);
        } catch (error) {
            console.error('Error checking wishlist:', error);
            return false;
        }
    },

    /**
     * Clear entire wishlist
     */
    clearWishlist: () => {
        try {
            localStorage.removeItem('wishlist');
            return true;
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            return false;
        }
    },

    /**
     * Get wishlist count
     */
    getWishlistCount: () => {
        return wishlistService.getWishlist().length;
    },

    /**
     * Export wishlist as JSON
     */
    exportWishlist: () => {
        const wishlist = wishlistService.getWishlist();
        return JSON.stringify(wishlist, null, 2);
    }
};
