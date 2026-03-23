const express = require('express');
const router = express.Router();

// Simple test route
router.get('/', (req, res) => {
    res.json({ 
        message: 'API is working!',
        timestamp: new Date()
    });
});

router.get('/db-test', async (req, res) => {
    try {
        const db = require('../config/database');
        const [rows] = await db.pool.query('SELECT 1+1 as result');
        res.json({ 
            success: true,
            message: 'Database connected!',
            result: rows[0].result
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Database error',
            error: error.message 
        });
    }
});

module.exports = router;