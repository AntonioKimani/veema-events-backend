const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Get cart endpoint - coming soon' });
});

router.post('/add', (req, res) => {
    res.json({ message: 'Add to cart - coming soon' });
});

module.exports = router;