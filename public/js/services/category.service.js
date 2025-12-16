// Category Service - Frontend API service for category management

const categoryService = {
    // Get all active categories
    async getCategories() {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) throw new Error('Failed to fetch categories');
            return await response.json();
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },

    // Get all categories (including inactive) - Admin/Owner only
    async getAllCategories() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/categories/admin/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch all categories');
            return await response.json();
        } catch (error) {
            console.error('Error fetching all categories:', error);
            return [];
        }
    },

    // Get single category
    async getCategory(id) {
        try {
            const response = await fetch(`/api/categories/${id}`);
            if (!response.ok) throw new Error('Failed to fetch category');
            return await response.json();
        } catch (error) {
            console.error('Error fetching category:', error);
            return null;
        }
    },

    // Create new category
    async createCategory(data) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create category');
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },

    // Update category
    async updateCategory(id, data) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update category');
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    // Rename category (quick edit)
    async renameCategory(id, displayName) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/categories/${id}/rename`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ displayName })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to rename category');
            }
            return await response.json();
        } catch (error) {
            console.error('Error renaming category:', error);
            throw error;
        }
    },

    // Delete category
    async deleteCategory(id) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete category');
            }
            return await response.json();
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },

    // Reorder categories
    async reorderCategories(categories) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/categories/admin/reorder', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ categories })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to reorder categories');
            }
            return await response.json();
        } catch (error) {
            console.error('Error reordering categories:', error);
            throw error;
        }
    }
};
