const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.pool.query('SELECT * FROM products');
        res.json({
            success: true,
            count: rows.length,
            products: rows
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch products' 
        });
    }
});

router.get('/featured', async (req, res) => {
    try {
        const [rows] = await db.pool.query(
            'SELECT * FROM products WHERE featured = true LIMIT 8'
        );
        res.json({
            success: true,
            count: rows.length,
            products: rows
        });
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch featured products' 
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.pool.query(
            'SELECT * FROM products WHERE id = ?', 
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }
        
        res.json({
            success: true,
            product: rows[0]
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch product' 
        });
    }
});

router.get('/category/:category', async (req, res) => {
    try {
        const [rows] = await db.pool.query(
            'SELECT * FROM products WHERE category = ?',
            [req.params.category]
        );
        
        res.json({
            success: true,
            count: rows.length,
            products: rows
        });
    } catch (error) {
        console.error('Error fetching by category:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch products' 
        });
    }
});

router.get('/search/:query', async (req, res) => {
    try {
        const [rows] = await db.pool.query(
            'SELECT * FROM products WHERE name LIKE ? OR description LIKE ?',
            [`%${req.params.query}%`, `%${req.params.query}%`]
        );
        
        res.json({
            success: true,
            count: rows.length,
            products: rows
        });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to search products' 
        });
    }
});

module.exports = router;