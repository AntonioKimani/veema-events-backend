const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    res.json({ message: 'Create order endpoint - coming soon' });
});

router.get('/my-orders', (req, res) => {
    res.json({ message: 'Get my orders - coming soon' });
});

module.exports = router;