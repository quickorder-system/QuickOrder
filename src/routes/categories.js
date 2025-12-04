const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

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

        const { name, displayName, description, icon, color, order } = req.body;

        if (!name || !displayName) {
            return res.status(400).json({ message: 'Category name and display name are required' });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ name: name.toLowerCase() });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }

        const category = new Category({
            name: name.toLowerCase(),
            displayName,
            description,
            icon: icon || 'fa-folder',
            color: color || '#667eea',
            order: order || 0
        });

        const newCategory = await category.save();
        logger.info(`Category created: ${newCategory.name}`, { userId: req.user.id, categoryId: newCategory._id });
        res.status(201).json(newCategory);
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

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const { displayName, description, icon, color, order, isActive } = req.body;

        if (displayName) category.displayName = displayName;
        if (description !== undefined) category.description = description;
        if (icon) category.icon = icon;
        if (color) category.color = color;
        if (order !== undefined) category.order = order;
        if (isActive !== undefined) category.isActive = isActive;

        const updatedCategory = await category.save();
        logger.info(`Category updated: ${category.name}`, { userId: req.user.id, categoryId: category._id });
        res.json(updatedCategory);
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

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await Category.deleteOne({ _id: req.params.id });
        logger.info(`Category deleted: ${category.name}`, { userId: req.user.id, categoryId: category._id });
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        logger.error('Error deleting category:', err);
        res.status(500).json({ message: 'Error deleting category' });
    }
});

// Rename category (quick edit)
router.patch('/:id/rename', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { displayName } = req.body;
        if (!displayName) {
            return res.status(400).json({ message: 'Display name is required' });
        }

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        category.displayName = displayName;
        const updatedCategory = await category.save();
        logger.info(`Category renamed: ${category.name} → ${displayName}`, { userId: req.user.id, categoryId: category._id });
        res.json(updatedCategory);
    } catch (err) {
        logger.error('Error renaming category:', err);
        res.status(500).json({ message: 'Error renaming category' });
    }
});

// Bulk update category order
router.patch('/admin/reorder', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { categories } = req.body;
        if (!Array.isArray(categories)) {
            return res.status(400).json({ message: 'Categories array is required' });
        }

        // Update order for each category
        for (let i = 0; i < categories.length; i++) {
            await Category.updateOne(
                { _id: categories[i].id },
                { order: i }
            );
        }

        logger.info('Categories reordered', { userId: req.user.id });
        res.json({ message: 'Categories reordered successfully' });
    } catch (err) {
        logger.error('Error reordering categories:', err);
        res.status(500).json({ message: 'Error reordering categories' });
    }
});

module.exports = router;
