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

module.exports = router;
