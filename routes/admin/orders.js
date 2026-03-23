const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Admin get all orders - coming soon' });
});

router.put('/:id', (req, res) => {
    res.json({ message: `Admin update order ${req.params.id} - coming soon` });
});

module.exports = router;