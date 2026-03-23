-- Create database
CREATE DATABASE IF NOT EXISTS veema_events;
USE veema_events;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    image_url VARCHAR(500),
    stock INT DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_featured (featured),
    INDEX idx_price (price),
    FULLTEXT idx_search (name, description)
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    notes TEXT,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    payment_method ENUM('mpesa', 'cash') DEFAULT 'mpesa',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    mpesa_transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * price) STORED,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id)
);

-- ============================================
-- CARTS TABLE
-- ============================================
CREATE TABLE carts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    items JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Insert admin user (password: Admin123!)
-- Hash for 'Admin123!' is: $2a$10$N9qo8uLOickgx2ZMRZoMy.MrqUA1xV5UK7xLQqZvK8QzZ9qL9qL9q
INSERT INTO users (name, email, password, phone, role) VALUES 
('Admin User', 'admin@veemaevents.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqUA1xV5UK7xLQqZvK8QzZ9qL9qL9q', '0700111222', 'admin');

-- Insert test user (password: password123)
INSERT INTO users (name, email, password, phone) VALUES 
('Test User', 'test@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqUA1xV5UK7xLQqZvK8QzZ9qL9qL9q', '0712345678');

-- Insert another test user
INSERT INTO users (name, email, password, phone) VALUES 
('John Doe', 'john@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqUA1xV5UK7xLQqZvK8QzZ9qL9qL9q', '0722334455');

-- Insert sample products
INSERT INTO products (name, description, price, category, stock, featured, image_url) VALUES
('Luxury Table Cloth - Gold', 'Premium quality gold table cloth perfect for weddings and formal events. 100% polyester, stain resistant, wrinkle-free. Size: 180x280cm', 3500.00, 'Table Linens', 25, true, '/uploads/tablecloth-gold.jpg'),
('Luxury Table Cloth - White', 'Elegant white table cloth for classic wedding setups. Wrinkle-free fabric, easy to clean. Size: 180x280cm', 3500.00, 'Table Linens', 30, true, '/uploads/tablecloth-white.jpg'),
('Premium Chair Ribbon - Burgundy', 'Beautiful burgundy ribbons for chair decorations. Each pack contains 50 pieces, 2 meters each. Satin finish.', 800.00, 'Ribbons', 100, true, '/uploads/ribbon-burgundy.jpg'),
('Gold Charger Plate', 'Metallic gold charger plate for elegant table settings. Set of 6. Diameter: 30cm', 450.00, 'Tableware', 200, true, '/uploads/charger-gold.jpg'),
('Crystal Centerpiece', 'Beautiful crystal centerpiece with LED lights. Perfect for head tables. Height: 25cm', 2500.00, 'Decor', 15, true, '/uploads/centerpiece-crystal.jpg'),
('Sequin Table Runner - Silver', 'Sparkling silver sequin table runner for glamorous events. Length: 200cm', 1200.00, 'Table Linens', 20, true, '/uploads/runner-sequin.jpg'),
('Napkin Rings - Gold', 'Set of 12 gold napkin rings with pearl accents.', 600.00, 'Tableware', 50, true, '/uploads/napkin-gold.jpg');

-- Insert a sample order
INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, delivery_address, total_amount, status, payment_status) VALUES
('EVT-20240306-001', 2, 'Test User', 'test@example.com', '0712345678', '123 Kenyatta Avenue, Nairobi', 7800.00, 'completed', 'paid');

INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
(1, 1, 'Luxury Table Cloth - Gold', 2, 3500.00),
(1, 4, 'Gold Charger Plate', 1, 450.00),
(1, 5, 'Crystal Centerpiece', 1, 2500.00);

-- Insert sample cart for test user
INSERT INTO carts (user_id, items) VALUES
(2, '[{"product_id": 3, "name": "Premium Chair Ribbon - Burgundy", "price": 800, "quantity": 5}, {"product_id": 4, "name": "Gold Charger Plate", "price": 450, "quantity": 8}]');

-- ============================================
-- CREATE VIEW FOR DASHBOARD STATS
-- ============================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM products) AS total_products,
    (SELECT COUNT(*) FROM orders) AS total_orders,
    (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_customers,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') AS total_admins,
    (SELECT SUM(total_amount) FROM orders WHERE status = 'completed') AS total_revenue,
    (SELECT COUNT(*) FROM products WHERE stock < 10) AS low_stock_count,
    (SELECT SUM(stock) FROM products) AS total_inventory;

-- ============================================
-- CREATE TRIGGER TO GENERATE ORDER NUMBER
-- ============================================
DELIMITER //
CREATE TRIGGER before_order_insert
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    DECLARE date_prefix VARCHAR(10);
    
    SET date_prefix = DATE_FORMAT(NOW(), '%Y%m%d');
    SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'orders');
    SET NEW.order_number = CONCAT('EVT-', date_prefix, '-', LPAD(next_id, 4, '0'));
END//
DELIMITER ;

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Create event to clean old carts
DROP EVENT IF EXISTS clean_old_carts;
CREATE EVENT clean_old_carts
ON SCHEDULE EVERY 1 DAY
DO
    DELETE FROM carts WHERE updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Show success message
SELECT 'Veema Events database setup completed successfully!' AS 'Status';
SELECT 'Admin: admin@veemaevents.com / Admin123!' AS 'Admin Login';
SELECT 'Test User: test@example.com / password123' AS 'Test Login';