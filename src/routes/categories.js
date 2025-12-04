const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const ActivityLog = require('../models/activityLog');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Helper function to log activities
async function logActivity(userId, username, action, description, details) {
    try {
        await ActivityLog.create({
            userId,
            username,
            action,
            description,
            details,
            page: 'ADMIN'
        });
    } catch (error) {
        logger.error('Error logging activity:', error);
    }
}

// Get all active categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ order: 1 });
        res.json(categories);
    } catch (err) {
        logger.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

// Get all categories (including inactive) - Admin/Owner only
router.get('/admin/all', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const categories = await Category.find().sort({ order: 1 });
        res.json(categories);
    } catch (err) {
        logger.error('Error fetching all categories:', err);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

// Get a single category
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (err) {
        logger.error('Error fetching category:', err);
        res.status(500).json({ message: 'Error fetching category' });
    }
});

// Create a new category - Admin/Owner only
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { name, displayName, description, icon, color, isActive } = req.body;

        if (!name || !displayName) {
            return res.status(400).json({ message: 'Name and display name are required' });
        }

        const existingCategory = await Category.findOne({ name: name.toLowerCase() });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category name already exists' });
        }

        const newCategory = new Category({
            name: name.toLowerCase(),
            displayName,
            description,
            icon: icon || 'fa-folder',
            color: color || '#667eea',
            isActive: isActive !== undefined ? isActive : true
        });

        await newCategory.save();
        logger.info(`Category created: ${name} by ${req.user._id}`);
        
        // Log to activity log
        await logActivity(
            req.user._id,
            req.user.username,
            'CREATE_CATEGORY',
            `Created category: ${displayName}`,
            { categoryId: newCategory._id, name, displayName }
        );
        
        res.status(201).json({ message: 'Category created successfully', category: newCategory });
    } catch (err) {
        logger.error('Error creating category:', err);
        res.status(500).json({ message: 'Error creating category' });
    }
});

// Update a category - Admin/Owner only
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { displayName, description, icon, color, isActive } = req.body;
        const updateData = {};

        if (displayName) updateData.displayName = displayName;
        if (description !== undefined) updateData.description = description;
        if (icon) updateData.icon = icon;
        if (color) updateData.color = color;
        if (isActive !== undefined) updateData.isActive = isActive;

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        logger.info(`Category updated: ${req.params.id} by ${req.user._id}`);
        
        // Log to activity log
        await logActivity(
            req.user._id,
            req.user.username,
            'UPDATE_CATEGORY',
            `Updated category: ${category.displayName}`,
            { categoryId: req.params.id, changes: updateData }
        );
        
        res.json({ message: 'Category updated successfully', category });
    } catch (err) {
        logger.error('Error updating category:', err);
        res.status(500).json({ message: 'Error updating category' });
    }
});

// Delete a category - Admin/Owner only
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        logger.info(`Category deleted: ${req.params.id} by ${req.user._id}`);
        
        // Log to activity log
        await logActivity(
            req.user._id,
            req.user.username,
            'DELETE_CATEGORY',
            `Deleted category: ${category.displayName}`,
            { categoryId: req.params.id, categoryName: category.name }
        );
        
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        logger.error('Error deleting category:', err);
        res.status(500).json({ message: 'Error deleting category' });
    }
});

// Quick rename endpoint - Admin/Owner only
router.patch('/:id/rename', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { displayName } = req.body;
        if (!displayName) {
            return res.status(400).json({ message: 'Display name is required' });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { displayName },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        logger.info(`Category renamed: ${req.params.id} by ${req.user._id}`);
        res.json({ message: 'Category renamed successfully', category });
    } catch (err) {
        logger.error('Error renaming category:', err);
        res.status(500).json({ message: 'Error renaming category' });
    }
});

// Bulk reorder endpoint - Admin/Owner only
router.patch('/admin/reorder', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { categories } = req.body;
        if (!Array.isArray(categories)) {
            return res.status(400).json({ message: 'Categories array is required' });
        }

        const updatePromises = categories.map(cat =>
            Category.findByIdAndUpdate(
                cat._id,
                { order: cat.order },
                { new: true }
            )
        );

        await Promise.all(updatePromises);
        logger.info(`Categories reordered by ${req.user._id}`);
        res.json({ message: 'Categories reordered successfully' });
    } catch (err) {
        logger.error('Error reordering categories:', err);
        res.status(500).json({ message: 'Error reordering categories' });
    }
});

module.exports = router;
