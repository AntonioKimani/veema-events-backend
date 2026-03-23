const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Admin dashboard - coming soon' });
});

module.exports = router;