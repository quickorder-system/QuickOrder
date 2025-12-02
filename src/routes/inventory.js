const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/inventory');
const auth = require('../middleware/auth');

// Get all inventory items
router.get('/', async (req, res) => {
    try {
        const items = await InventoryItem.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a single inventory item
router.get('/:id', auth, async (req, res) => {
    try {
        const item = await InventoryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new inventory item
router.post('/', auth, async (req, res) => {
    const item = new InventoryItem({
        itemName: req.body.itemName,
        category: req.body.category,
        price: req.body.price,
        unit: req.body.unit,
        quantity: req.body.quantity,
        alertLevel: req.body.alertLevel,
        description: req.body.description,
        image: req.body.image
    });

    try {
        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update an inventory item (full update with PUT)
router.put('/:id', auth, async (req, res) => {
    try {
        const item = await InventoryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });

        if (req.body.itemName !== undefined) item.itemName = req.body.itemName;
        if (req.body.category !== undefined) item.category = req.body.category;
        if (req.body.price !== undefined) item.price = req.body.price;
        if (req.body.unit !== undefined) item.unit = req.body.unit;
        if (req.body.quantity !== undefined) item.quantity = req.body.quantity;
        if (req.body.alertLevel !== undefined) item.alertLevel = req.body.alertLevel;
        if (req.body.description !== undefined) item.description = req.body.description;
        if (req.body.image !== undefined) item.image = req.body.image;
        if (req.body.isAvailable !== undefined) item.isAvailable = req.body.isAvailable;

        const updatedItem = await item.save();
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Partial update an inventory item (flexible PATCH for both Admin and Super Admin)
router.patch('/:id', auth, async (req, res) => {
    try {
        const item = await InventoryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });

        // Dynamically update only provided fields
        const allowedFields = ['itemName', 'category', 'price', 'unit', 'quantity', 'alertLevel', 'description', 'image', 'isAvailable'];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                item[field] = req.body[field];
            }
        });

        const updatedItem = await item.save();
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an inventory item
router.delete('/:id', auth, async (req, res) => {
    try {
        const item = await InventoryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });

        await InventoryItem.deleteOne({ _id: req.params.id });
        res.json({ message: 'Inventory item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route POST /api/inventory/:itemId/variations
 * @description Add a new variation group to an item (e.g., "Size")
 * @access Private (Admin/Owner only)
 */
router.post('/:itemId/variations', auth, async (req, res) => {
    try {
        const { variationName, options } = req.body;
        
        if (!variationName || !Array.isArray(options) || options.length === 0) {
            return res.status(400).json({ 
                message: 'variationName and options array are required' 
            });
        }

        const item = await InventoryItem.findById(req.params.itemId);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });

        // Check if variation with same name already exists
        const existingVariation = item.variations.find(v => v.variationName === variationName);
        if (existingVariation) {
            return res.status(400).json({ 
                message: 'Variation with this name already exists' 
            });
        }

        // Add new variation
        item.variations.push({
            variationName,
            options: options.map(opt => ({
                optionName: opt.optionName,
                priceModifier: opt.priceModifier || 0,
                quantity: opt.quantity || 0,
                isAvailable: opt.isAvailable !== false
            }))
        });

        const updatedItem = await item.save();
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @route PUT /api/inventory/:itemId/variations/:variationIndex
 * @description Update a variation group
 * @access Private (Admin/Owner only)
 */
router.put('/:itemId/variations/:variationIndex', auth, async (req, res) => {
    try {
        const { variationIndex } = req.params;
        const { variationName, options } = req.body;

        const item = await InventoryItem.findById(req.params.itemId);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });

        if (variationIndex < 0 || variationIndex >= item.variations.length) {
            return res.status(404).json({ message: 'Variation not found' });
        }

        if (variationName) item.variations[variationIndex].variationName = variationName;
        if (Array.isArray(options)) {
            item.variations[variationIndex].options = options.map(opt => ({
                optionName: opt.optionName,
                priceModifier: opt.priceModifier || 0,
                quantity: opt.quantity || 0,
                isAvailable: opt.isAvailable !== false
            }));
        }

        const updatedItem = await item.save();
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @route DELETE /api/inventory/:itemId/variations/:variationIndex
 * @description Delete a variation group
 * @access Private (Admin/Owner only)
 */
router.delete('/:itemId/variations/:variationIndex', auth, async (req, res) => {
    try {
        const { itemId, variationIndex } = req.params;

        const item = await InventoryItem.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });

        if (variationIndex < 0 || variationIndex >= item.variations.length) {
            return res.status(404).json({ message: 'Variation not found' });
        }

        item.variations.splice(variationIndex, 1);
        const updatedItem = await item.save();
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route POST /api/inventory/:itemId/variations/:variationIndex/options
 * @description Add a new option to a variation
 * @access Private (Admin/Owner only)
 */
router.post('/:itemId/variations/:variationIndex/options', auth, async (req, res) => {
    try {
        const { itemId, variationIndex } = req.params;
        const { optionName, priceModifier, quantity } = req.body;

        if (!optionName) {
            return res.status(400).json({ message: 'optionName is required' });
        }

        const item = await InventoryItem.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });

        if (variationIndex < 0 || variationIndex >= item.variations.length) {
            return res.status(404).json({ message: 'Variation not found' });
        }

        // Check if option already exists
        const existingOption = item.variations[variationIndex].options.find(
            o => o.optionName === optionName
        );
        if (existingOption) {
            return res.status(400).json({ message: 'Option with this name already exists' });
        }

        item.variations[variationIndex].options.push({
            optionName,
            priceModifier: priceModifier || 0,
            quantity: quantity || 0,
            isAvailable: true
        });

        const updatedItem = await item.save();
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @route PUT /api/inventory/:itemId/variations/:variationIndex/options/:optionIndex
 * @description Update an option in a variation
 * @access Private (Admin/Owner only)
 */
router.put('/:itemId/variations/:variationIndex/options/:optionIndex', auth, async (req, res) => {
    try {
        const { itemId, variationIndex, optionIndex } = req.params;
        const { optionName, priceModifier, quantity, isAvailable } = req.body;

        const item = await InventoryItem.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });

        if (variationIndex < 0 || variationIndex >= item.variations.length) {
            return res.status(404).json({ message: 'Variation not found' });
        }

        if (optionIndex < 0 || optionIndex >= item.variations[variationIndex].options.length) {
            return res.status(404).json({ message: 'Option not found' });
        }

        const option = item.variations[variationIndex].options[optionIndex];
        if (optionName) option.optionName = optionName;
        if (priceModifier !== undefined) option.priceModifier = priceModifier;
        if (quantity !== undefined) option.quantity = quantity;
        if (isAvailable !== undefined) option.isAvailable = isAvailable;

        const updatedItem = await item.save();
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @route DELETE /api/inventory/:itemId/variations/:variationIndex/options/:optionIndex
 * @description Delete an option from a variation
 * @access Private (Admin/Owner only)
 */
router.delete('/:itemId/variations/:variationIndex/options/:optionIndex', auth, async (req, res) => {
    try {
        const { itemId, variationIndex, optionIndex } = req.params;

        const item = await InventoryItem.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });

        if (variationIndex < 0 || variationIndex >= item.variations.length) {
            return res.status(404).json({ message: 'Variation not found' });
        }

        if (optionIndex < 0 || optionIndex >= item.variations[variationIndex].options.length) {
            return res.status(404).json({ message: 'Option not found' });
        }

        item.variations[variationIndex].options.splice(optionIndex, 1);
        const updatedItem = await item.save();
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
