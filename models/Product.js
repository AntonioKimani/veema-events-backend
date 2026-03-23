const db = require('../config/database');

const Product = {
    getAll: async (filters = {}) => {
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];
        
        if (filters.category) {
            sql += ' AND category = ?';
            params.push(filters.category);
        }
        
        if (filters.featured) {
            sql += ' AND featured = ?';
            params.push(filters.featured);
        }
        
        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }
        
        const [rows] = await db.pool.query(sql, params);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.pool.query('SELECT * FROM products WHERE id = ?', [id]);
        return rows[0];
    },

    getFeatured: async (limit = 8) => {
        const [rows] = await db.pool.query(
            'SELECT * FROM products WHERE featured = true LIMIT ?',
            [limit]
        );
        return rows;
    },

    create: async (productData) => {
        const { name, description, price, category, image_url, stock, featured } = productData;
        const [result] = await db.pool.query(
            'INSERT INTO products (name, description, price, category, image_url, stock, featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, price, category, image_url, stock, featured || false]
        );
        return result.insertId;
    },

    update: async (id, productData) => {
        const { name, description, price, category, image_url, stock, featured } = productData;
        const [result] = await db.pool.query(
            'UPDATE products SET name = ?, description = ?, price = ?, category = ?, image_url = ?, stock = ?, featured = ? WHERE id = ?',
            [name, description, price, category, image_url, stock, featured, id]
        );
        return result.affectedRows > 0;
    },

    delete: async (id) => {
        const [result] = await db.pool.query('DELETE FROM products WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    updateStock: async (id, quantity) => {
        const [result] = await db.pool.query(
            'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
            [quantity, id, quantity]
        );
        return result.affectedRows > 0;
    },

    search: async (query) => {
        const [rows] = await db.pool.query(
            'SELECT * FROM products WHERE name LIKE ? OR description LIKE ?',
            [`%${query}%`, `%${query}%`]
        );
        return rows;
    },

    getByCategory: async (category) => {
        const [rows] = await db.pool.query(
            'SELECT * FROM products WHERE category = ?',
            [category]
        );
        return rows;
    },

    getLowStock: async (threshold = 10) => {
        const [rows] = await db.pool.query(
            'SELECT * FROM products WHERE stock < ? ORDER BY stock ASC',
            [threshold]
        );
        return rows;
    }
};

module.exports = Product;