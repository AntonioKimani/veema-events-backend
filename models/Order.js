const db = require('../config/database');
const { generateOrderNumber } = require('../utils/helpers');

const Order = {
    // Create new order
    create: async (orderData) => {
        const connection = await db.pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const {
                user_id,
                customer_name,
                customer_email,
                customer_phone,
                delivery_address,
                notes,
                items,
                total_amount,
                payment_method = 'mpesa'
            } = orderData;
            
            const order_number = generateOrderNumber();
            
            const [orderResult] = await connection.query(
                `INSERT INTO orders 
                (order_number, user_id, customer_name, customer_email, customer_phone, 
                 delivery_address, notes, total_amount, payment_method) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [order_number, user_id, customer_name, customer_email, customer_phone, 
                 delivery_address, notes, total_amount, payment_method]
            );
            
            const orderId = orderResult.insertId;
            
            for (const item of items) {
                await connection.query(
                    `INSERT INTO order_items 
                    (order_id, product_id, product_name, quantity, price) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [orderId, item.product_id, item.name, item.quantity || 1, item.price]
                );
                
                if (item.product_id) {
                    await connection.query(
                        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
                        [item.quantity || 1, item.product_id, item.quantity || 1]
                    );
                }
            }
            
            await connection.commit();
            
            return {
                order_id: orderId,
                order_number,
                total_amount
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get order by ID
    getById: async (id) => {
        const [orders] = await db.pool.query(`
            SELECT o.*, 
                   JSON_ARRAYAGG(
                       JSON_OBJECT(
                           'id', oi.id,
                           'product_id', oi.product_id,
                           'product_name', oi.product_name,
                           'quantity', oi.quantity,
                           'price', oi.price,
                           'subtotal', oi.subtotal
                       )
                   ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = ?
            GROUP BY o.id
        `, [id]);
        
        if (orders[0]) {
            orders[0].items = JSON.parse(orders[0].items);
        }
        
        return orders[0];
    },

    // Get order by order number
    getByOrderNumber: async (orderNumber) => {
        const [orders] = await db.pool.query(`
            SELECT o.*, 
                   JSON_ARRAYAGG(
                       JSON_OBJECT(
                           'id', oi.id,
                           'product_id', oi.product_id,
                           'product_name', oi.product_name,
                           'quantity', oi.quantity,
                           'price', oi.price,
                           'subtotal', oi.subtotal
                       )
                   ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.order_number = ?
            GROUP BY o.id
        `, [orderNumber]);
        
        if (orders[0]) {
            orders[0].items = JSON.parse(orders[0].items);
        }
        
        return orders[0];
    },

    // Get user's orders
    getUserOrders: async (userId) => {
        const [rows] = await db.pool.query(`
            SELECT o.*, 
                   COUNT(oi.id) as total_items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `, [userId]);
        
        return rows;
    },

    // Get all orders (admin)
    getAll: async (filters = {}) => {
        let sql = `
            SELECT o.*, 
                   COUNT(oi.id) as total_items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE 1=1
        `;
        const params = [];
        
        if (filters.status) {
            sql += ' AND o.status = ?';
            params.push(filters.status);
        }
        
        if (filters.payment_status) {
            sql += ' AND o.payment_status = ?';
            params.push(filters.payment_status);
        }
        
        if (filters.start_date) {
            sql += ' AND DATE(o.created_at) >= ?';
            params.push(filters.start_date);
        }
        
        if (filters.end_date) {
            sql += ' AND DATE(o.created_at) <= ?';
            params.push(filters.end_date);
        }
        
        sql += ' GROUP BY o.id ORDER BY o.created_at DESC';
        
        const [rows] = await db.pool.query(sql, params);
        return rows;
    },

    // Update order status
    updateStatus: async (id, status) => {
        const [result] = await db.pool.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    },

    // Update payment status
    updatePaymentStatus: async (id, paymentStatus, mpesaTransactionId = null) => {
        let sql = 'UPDATE orders SET payment_status = ?';
        const params = [paymentStatus];
        
        if (mpesaTransactionId) {
            sql += ', mpesa_transaction_id = ?';
            params.push(mpesaTransactionId);
        }
        
        sql += ' WHERE id = ?';
        params.push(id);
        
        const [result] = await db.pool.query(sql, params);
        return result.affectedRows > 0;
    },

    // Get order statistics (admin)
    getStats: async (period = 'month') => {
        let sql;
        
        if (period === 'week') {
            sql = `
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as order_count,
                    SUM(total_amount) as revenue
                FROM orders
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date
            `;
        } else if (period === 'month') {
            sql = `
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as order_count,
                    SUM(total_amount) as revenue
                FROM orders
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date
            `;
        } else {
            sql = `
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as order_count,
                    SUM(total_amount) as revenue
                FROM orders
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month
            `;
        }
        
        const [rows] = await db.pool.query(sql);
        return rows;
    },

    // Get recent orders
    getRecent: async (limit = 10) => {
        const [rows] = await db.pool.query(`
            SELECT o.*, 
                   COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT ?
        `, [limit]);
        
        return rows;
    },

    // Update payment status by CheckoutRequestID (for M-Pesa callback)
    updatePaymentStatusByCheckoutID: async (checkoutRequestID, paymentStatus, mpesaTransactionId) => {
        // You'll need to store checkoutRequestID in your orders table
        // This is a placeholder - you need to add a column for it
        console.log(`Updating order with CheckoutID: ${checkoutRequestID}`);
        return true;
    }
};

module.exports = Order;