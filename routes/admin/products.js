const express = require('express');
const router = express.Router();

// Get all products (admin)
router.get('/', (req, res) => {
    res.json({ message: 'Admin get products - coming soon' });
});

// Create new product
router.post('/', (req, res) => {
    res.json({ message: 'Admin create product - coming soon' });
});

// Update product
router.put('/:id', (req, res) => {
    res.json({ message: `Admin update product ${req.params.id} - coming soon` });
});

// Delete product
router.delete('/:id', (req, res) => {
    res.json({ message: `Admin delete product ${req.params.id} - coming soon` });
});

module.exports = router;